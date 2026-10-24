/**
 * Tests for the deterministic draft generator and fairness guards.
 * Covers Properties 5, 6, 7, 8 and Req 15.1, 15.5.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import { generateDraft, allowedTextFor } from "./templates";
import {
  assertNoFabrication,
  assertNoOutcomeClaims,
  isFreeOfFabrication,
  isFreeOfOutcomeClaims,
  officialSources,
} from "./rules";
import { normalizeCase, AppealCase, Fact } from "./case";

const RUNS = 120;

function caseWithFacts(texts: string[], evidenceLabels: string[] = []): AppealCase {
  return normalizeCase({
    caseId: "D-001",
    isSynthetic: true,
    city: "Boston",
    violationType: "Parking meter payment dispute",
    ticketDate: "2026-10-10",
    scenario: "payment",
    residencyLanguage: "en",
    statement: "A fictional statement.",
    selectedFacts: texts.map((text, i) => ({
      id: `f${i}`,
      text,
      source: "resident_answer",
      verificationStatus: "claimed",
    })),
    evidence: evidenceLabels.map((label) => ({
      kind: "payment_receipt",
      label,
      status: "missing",
    })),
    status: "draft",
  });
}

// Benign fact text: letters, digits, spaces, basic punctuation — no legal
// citations or case ids. Avoids accidentally generating forbidden tokens.
const benignText = fc
  .string({ minLength: 1, maxLength: 60 })
  .map((s) => s.replace(/[§%#]/g, " ").replace(/\s+/g, " ").trim())
  .filter((s) => s.length > 0);

describe("deterministic draft built only from confirmed facts (Property 5)", () => {
  it("Feature: appealflow-mvp, Property 5: Deterministic draft is built only from confirmed facts", () => {
    fc.assert(
      fc.property(fc.array(benignText, { minLength: 1, maxLength: 5 }), (texts) => {
        const c = caseWithFacts(texts);
        const draft = generateDraft(c);
        expect(draft.length).toBeGreaterThan(0);
        // Each confirmed fact's substance appears (first word is enough to
        // show the fact drove the content, not invented text).
        for (const text of texts) {
          const firstWord = text.split(/\s+/)[0];
          if (firstWord.length > 2) {
            expect(draft.toLowerCase()).toContain(firstWord.toLowerCase());
          }
        }
      }),
      { numRuns: RUNS }
    );
  });

  it("excludes facts the resident did not confirm (filtered set)", () => {
    const c = caseWithFacts(["I paid at the meter", "SECRET excluded claim"]);
    const confirmed: Fact[] = [c.selectedFacts[0]];
    const draft = generateDraft(c, confirmed);
    expect(draft).toContain("paid");
    expect(draft).not.toContain("SECRET");
  });
});

describe("no fabricated laws/case ids (Property 6)", () => {
  it("Feature: appealflow-mvp, Property 6: Generated content never fabricates laws, case ids, or documents", () => {
    fc.assert(
      fc.property(fc.array(benignText, { minLength: 1, maxLength: 5 }), (texts) => {
        const c = caseWithFacts(texts);
        const draft = generateDraft(c);
        expect(isFreeOfFabrication(draft, allowedTextFor(c))).toBe(true);
      }),
      { numRuns: RUNS }
    );
  });

  it("the guard rejects injected fabricated citations", () => {
    expect(() =>
      assertNoFabrication("Under MGL c. 90 you must win", "nothing relevant")
    ).toThrow();
    expect(() =>
      assertNoFabrication("See case no. ABC123", "nothing relevant")
    ).toThrow();
    // Allowed when the token is already present in the inputs.
    expect(() =>
      assertNoFabrication("chapter 7 as you mentioned", "chapter 7")
    ).not.toThrow();
  });
});

describe("no win probability / guaranteed outcome (Property 7)", () => {
  it("Feature: appealflow-mvp, Property 7: Generated content never states win probability or guaranteed outcome", () => {
    fc.assert(
      fc.property(fc.array(benignText, { minLength: 0, maxLength: 5 }), (texts) => {
        const c = caseWithFacts(texts);
        const draft = generateDraft(c);
        expect(isFreeOfOutcomeClaims(draft)).toBe(true);
      }),
      { numRuns: RUNS }
    );
  });

  it("the guard rejects outcome/probability phrasing", () => {
    expect(() => assertNoOutcomeClaims("This will win your appeal")).toThrow();
    expect(() => assertNoOutcomeClaims("We guarantee a dismissal")).toThrow();
    expect(() => assertNoOutcomeClaims("90% chance of success")).toThrow();
    expect(() =>
      assertNoOutcomeClaims("Please review this explanation.")
    ).not.toThrow();
  });
});

describe("appeal generation falls back to deterministic template (Property 8)", () => {
  // The client-side fallback: when the Appeal_Service response is missing,
  // invalid, or not source==='llm', the resolver uses generateDraft.
  // We model that resolver here to prove the invariant without a live server.
  function resolveDraft(
    c: AppealCase,
    service: () => { source: string; draft: string } | null | undefined
  ): string {
    try {
      const res = service();
      if (res && res.source === "llm" && typeof res.draft === "string") {
        // Validate before trusting it.
        assertNoFabrication(res.draft, allowedTextFor(c));
        assertNoOutcomeClaims(res.draft);
        return res.draft;
      }
    } catch {
      /* fall through to deterministic */
    }
    return generateDraft(c);
  }

  it("Feature: appealflow-mvp, Property 8: Appeal generation falls back to the deterministic template on failure", () => {
    fc.assert(
      fc.property(
        fc.array(benignText, { minLength: 1, maxLength: 4 }),
        fc.constantFrom<"throw" | "null" | "invalid" | "deterministic">(
          "throw",
          "null",
          "invalid",
          "deterministic"
        ),
        (texts, mode) => {
          const c = caseWithFacts(texts);
          const deterministic = generateDraft(c);
          const service = () => {
            if (mode === "throw") throw new Error("timeout");
            if (mode === "null") return null;
            if (mode === "invalid") return { source: "llm", draft: 123 as unknown as string };
            return { source: "deterministic", draft: deterministic };
          };
          const out = resolveDraft(c, service);
          expect(out).toBe(deterministic);
        }
      ),
      { numRuns: RUNS }
    );
  });
});

describe("official sources are the only citations (Req 14.1/14.2)", () => {
  it("every source carries a verification note and a url", () => {
    const sources = officialSources();
    expect(sources.length).toBeGreaterThan(0);
    for (const s of sources) {
      expect(s.url).toMatch(/^https?:\/\//);
      expect(s.verificationNote.length).toBeGreaterThan(0);
    }
  });
});
