/**
 * Tests for the domain model, Case_Store, and status state machine.
 * Covers Properties 3, 4, 9, 10 and Req 15.1, 15.3, 15.4.
 */

import { describe, it, expect, beforeEach } from "vitest";
import fc from "fast-check";
import {
  AppealCase,
  CASE_STATUSES,
  CaseStatus,
  CaseStore,
  TRANSITIONS,
  addEvidence,
  addFact,
  canTransition,
  editFact,
  normalizeCase,
  removeFact,
  transition,
} from "./case";
import demoCases from "@/data/demo_cases.json";

const RUNS = 120;

function baseCase(overrides: Partial<AppealCase> = {}): AppealCase {
  return normalizeCase({
    caseId: "T-001",
    isSynthetic: true,
    city: "Boston",
    violationType: "Parking meter payment dispute",
    ticketDate: "2026-10-10",
    scenario: "payment",
    residencyLanguage: "en",
    statement: "A fictional statement.",
    selectedFacts: [],
    evidence: [],
    status: "draft",
    ...overrides,
  });
}

describe("demo-case normalization", () => {
  it("normalizes both demo cases into complete AppealCases", () => {
    for (const raw of demoCases as unknown[]) {
      const c = normalizeCase(raw);
      expect(c.caseId).toBeTruthy();
      expect(Array.isArray(c.provenance)).toBe(true);
      expect(Array.isArray(c.answeredQuestionIds)).toBe(true);
      expect(CASE_STATUSES).toContain(c.status);
    }
  });

  it("drops unknown keys and defaults missing fields", () => {
    const c = normalizeCase({ caseId: "X", junk: 42, scenario: "nope" });
    expect((c as unknown as Record<string, unknown>).junk).toBeUndefined();
    expect(c.scenario).toBe("other"); // invalid scenario defaults
    expect(c.status).toBe("draft");
  });
});

describe("Case_Store round-trip (Property 4)", () => {
  beforeEach(() => CaseStore._reset());

  it("Feature: appealflow-mvp, Property 4: Case_Store round-trip preserves state", () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.oneof(
            fc.record({ op: fc.constant("addFact" as const), text: fc.string({ minLength: 1, maxLength: 40 }) }),
            fc.record({ op: fc.constant("editIdx" as const), idx: fc.nat(5), text: fc.string({ minLength: 1, maxLength: 40 }) }),
            fc.record({ op: fc.constant("removeIdx" as const), idx: fc.nat(5) }),
            fc.record({ op: fc.constant("addEvidence" as const), label: fc.string({ minLength: 1, maxLength: 20 }) })
          ),
          { maxLength: 12 }
        ),
        (ops) => {
          let c = baseCase();
          for (const op of ops) {
            if (op.op === "addFact") c = addFact(c, op.text);
            else if (op.op === "editIdx" && c.selectedFacts[op.idx])
              c = editFact(c, c.selectedFacts[op.idx].id, op.text);
            else if (op.op === "removeIdx" && c.selectedFacts[op.idx])
              c = removeFact(c, c.selectedFacts[op.idx].id);
            else if (op.op === "addEvidence")
              c = addEvidence(c, { kind: "other", label: op.label, status: "missing" });
          }
          // Round-trip through JSON (the storage serialization path).
          const reloaded = normalizeCase(JSON.parse(JSON.stringify(c)));
          expect(reloaded.selectedFacts.map((f) => f.text)).toEqual(
            c.selectedFacts.map((f) => f.text)
          );
          expect(reloaded.evidence.map((e) => e.label)).toEqual(
            c.evidence.map((e) => e.label)
          );
        }
      ),
      { numRuns: RUNS }
    );
  });

  it("persists and retrieves the active case", () => {
    const c = baseCase();
    CaseStore.save(c);
    CaseStore.setActive(c.caseId);
    expect(CaseStore.getActive()?.caseId).toBe(c.caseId);
  });
});

describe("fact provenance (Property 3)", () => {
  it("Feature: appealflow-mvp, Property 3: Answers produce provenance-tagged facts", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1, maxLength: 80 }), (text) => {
        const c = addFact(baseCase(), text, {
          source: "resident_answer",
          verificationStatus: "claimed",
        });
        const fact = c.selectedFacts[c.selectedFacts.length - 1];
        expect(fact.source).toBe("resident_answer");
        expect(fact.verificationStatus).toBe("claimed");
        expect(fact.id).toBeTruthy();
        expect(fact.text).toBe(text);
      }),
      { numRuns: RUNS }
    );
  });
});

describe("status transitions (Property 9)", () => {
  it("Feature: appealflow-mvp, Property 9: Status transitions are legal and closed over the allowed set", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<CaseStatus>(...CASE_STATUSES),
        fc.constantFrom<CaseStatus>(...CASE_STATUSES),
        (from, to) => {
          const allowed = TRANSITIONS[from].includes(to);
          expect(canTransition(from, to)).toBe(allowed);
          const c = baseCase({ status: from });
          if (allowed) {
            const next = transition(c, to);
            expect(next.status).toBe(to);
            expect(CASE_STATUSES).toContain(next.status);
          } else {
            expect(() => transition(c, to)).toThrow();
          }
        }
      ),
      { numRuns: RUNS }
    );
  });

  it("has no transition into any submitted/accepted state", () => {
    const targets = new Set(Object.values(TRANSITIONS).flat());
    expect(targets.has("submission_unverified")).toBe(true);
    // There is no "submitted" status at all.
    expect(CASE_STATUSES).not.toContain("submitted" as CaseStatus);
    expect(TRANSITIONS.simulated_outcome).toEqual([]); // terminal
  });
});

describe("provenance append-only (Property 10)", () => {
  it("Feature: appealflow-mvp, Property 10: Provenance history grows append-only", () => {
    fc.assert(
      fc.property(
        fc.array(fc.string({ minLength: 1, maxLength: 20 }), { maxLength: 10 }),
        (texts) => {
          let c = baseCase();
          const snapshots: string[][] = [];
          for (const t of texts) {
            c = addFact(c, t);
            snapshots.push(c.provenance.map((p) => p.id));
          }
          // Each snapshot is a prefix-extension of the previous one.
          for (let i = 1; i < snapshots.length; i++) {
            expect(snapshots[i].length).toBe(snapshots[i - 1].length + 1);
            expect(snapshots[i].slice(0, snapshots[i - 1].length)).toEqual(
              snapshots[i - 1]
            );
          }
        }
      ),
      { numRuns: RUNS }
    );
  });
});
