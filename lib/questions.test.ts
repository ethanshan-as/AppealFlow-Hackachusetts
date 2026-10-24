/**
 * Tests for the Branch_Bank and deterministic Question_Engine.
 * Covers Properties 1, 2, 11, 12 and Req 15.1, 15.2, 15.6.
 */

import { describe, it, expect } from "vitest";
import fc from "fast-check";
import {
  BRANCH_BANKS,
  BUILT_SCENARIOS,
  OTHER_CHOICE,
  answerEntry,
  isStubScenario,
  nextQuestion,
  presentedChoices,
  STUB_SCENARIOS,
} from "./questions";
import { normalizeCase, AppealCase, Scenario } from "./case";
import { LANGS, t } from "./translations";

const RUNS = 120;

function caseFor(scenario: Scenario, answered: string[] = []): AppealCase {
  return normalizeCase({
    caseId: "Q-001",
    isSynthetic: true,
    scenario,
    residencyLanguage: "en",
    status: "draft",
    selectedFacts: [],
    evidence: [],
    answeredQuestionIds: answered,
  });
}

/** Walk a built scenario by always choosing the first real choice. */
function walk(scenario: Scenario): number {
  let c = caseFor(scenario);
  let count = 0;
  let guard = 0;
  while (guard++ < 10) {
    const q = nextQuestion(c);
    if (!q) break;
    count += 1;
    const first = q.choices[0];
    c = caseFor(scenario, [...c.answeredQuestionIds, answerEntry(q.id, first.id)]);
  }
  return count;
}

describe("built scenarios present 2–4 sequential questions (Property 1)", () => {
  it("Feature: appealflow-mvp, Property 1: Built scenarios present 2–4 sequential questions", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Scenario>(...BUILT_SCENARIOS),
        fc.array(fc.nat(3), { maxLength: 6 }),
        (scenario, choiceIdxs) => {
          let c = caseFor(scenario);
          let presented = 0;
          let step = 0;
          let guard = 0;
          while (guard++ < 10) {
            const q = nextQuestion(c);
            if (!q) break;
            presented += 1;
            // one question at a time: exactly one question returned
            const choiceIdx = (choiceIdxs[step] ?? 0) % q.choices.length;
            const chosen = q.choices[choiceIdx];
            c = caseFor(scenario, [
              ...c.answeredQuestionIds,
              answerEntry(q.id, chosen.id),
            ]);
            step += 1;
          }
          expect(presented).toBeGreaterThanOrEqual(2);
          expect(presented).toBeLessThanOrEqual(4);
        }
      ),
      { numRuns: RUNS }
    );
  });

  it("payment yields 2–3 questions, breakdown yields 3", () => {
    expect(walk("payment")).toBeGreaterThanOrEqual(2);
    expect(walk("payment")).toBeLessThanOrEqual(3);
    expect(walk("breakdown")).toBe(3);
  });
});

describe("every presented question is neutral, bounded, unselected (Property 2)", () => {
  it("Feature: appealflow-mvp, Property 2: Every presented question is neutral, bounded, and unselected", () => {
    for (const scenario of BUILT_SCENARIOS) {
      const bank = BRANCH_BANKS[scenario]!;
      for (const q of bank) {
        const choices = presentedChoices(q);
        // 2–4 base choices plus exactly one "Other / not sure"
        expect(q.choices.length).toBeGreaterThanOrEqual(2);
        expect(q.choices.length).toBeLessThanOrEqual(4);
        expect(choices[choices.length - 1].id).toBe(OTHER_CHOICE.id);
        expect(choices.filter((x) => x.id === OTHER_CHOICE.id).length).toBe(1);
        // Nothing preselected: choices carry no "selected" flag; selection is
        // owned by the caller and starts null. We assert the data shape here.
        for (const ch of choices) {
          expect(Object.prototype.hasOwnProperty.call(ch, "selected")).toBe(
            false
          );
        }
      }
    }
  });
});

describe("deterministic fallback / referential stability (Property 11)", () => {
  it("Feature: appealflow-mvp, Property 11: Question_Engine uses the deterministic Branch_Bank with no credentials", () => {
    fc.assert(
      fc.property(
        fc.constantFrom<Scenario>(...BUILT_SCENARIOS),
        fc.array(fc.nat(3), { maxLength: 4 }),
        (scenario, choiceIdxs) => {
          let c = caseFor(scenario);
          for (const idx of choiceIdxs) {
            const q = nextQuestion(c);
            if (!q) break;
            const chosen = q.choices[idx % q.choices.length];
            c = caseFor(scenario, [
              ...c.answeredQuestionIds,
              answerEntry(q.id, chosen.id),
            ]);
          }
          // Same case -> same question (pure function, no randomness).
          const a = nextQuestion(c);
          const b = nextQuestion(c);
          expect(a?.id).toBe(b?.id);
        }
      ),
      { numRuns: RUNS }
    );
  });

  it("stub scenarios have no branch questions", () => {
    for (const scenario of STUB_SCENARIOS) {
      expect(isStubScenario(scenario)).toBe(true);
      expect(nextQuestion(caseFor(scenario))).toBeNull();
    }
  });
});

describe("every Branch_Bank question is fully translated (Property 12)", () => {
  it("Feature: appealflow-mvp, Property 12: Every Branch_Bank question is fully translated", () => {
    for (const scenario of BUILT_SCENARIOS) {
      const bank = BRANCH_BANKS[scenario]!;
      for (const q of bank) {
        for (const lang of LANGS) {
          // A translation exists (not falling back to the raw key).
          expect(t(lang, q.promptKey)).not.toBe(q.promptKey);
          for (const ch of q.choices) {
            expect(t(lang, ch.labelKey)).not.toBe(ch.labelKey);
          }
          expect(t(lang, OTHER_CHOICE.labelKey)).not.toBe(OTHER_CHOICE.labelKey);
        }
      }
    }
  });
});
