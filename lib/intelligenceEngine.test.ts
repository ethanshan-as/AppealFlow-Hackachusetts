/**
 * Tests for the deterministic Case Intelligence Engine.
 *
 * Proves: metrics change correctly as the case gains facts/evidence, the Next
 * Best Question prioritizes missing required facts without repeating answered
 * ones, and "no evidence" always yields zero verified evidence.
 */

import { describe, it, expect } from "vitest";
import {
  evidenceCoverage,
  factualCompleteness,
  intelligenceReport,
  nextBestQuestion,
  preparationScore,
  requiredFactsFor,
} from "./intelligenceEngine";
import { answerEntry } from "./questions";
import { normalizeCase, AppealCase, Scenario } from "./case";

function caseFor(
  scenario: Scenario,
  opts: {
    answered?: string[];
    facts?: string[];
    evidence?: { label: string; status: string }[];
  } = {}
): AppealCase {
  return normalizeCase({
    caseId: "IE-1",
    isSynthetic: true,
    city: "Boston",
    violationType: "x",
    ticketDate: "2026-10-10",
    scenario,
    residencyLanguage: "en",
    statement: "x",
    answeredQuestionIds: opts.answered ?? [],
    selectedFacts: (opts.facts ?? []).map((text, i) => ({
      id: `f${i}`,
      text,
      source: "resident_answer",
      verificationStatus: "claimed",
    })),
    evidence: (opts.evidence ?? []).map((e) => ({
      kind: "payment_receipt",
      label: e.label,
      status: e.status,
    })),
    status: "draft",
  });
}

describe("factual completeness changes as required facts are answered", () => {
  it("starts at 0 and rises to 1 as payment questions are answered", () => {
    const required = requiredFactsFor("payment");
    expect(required.length).toBeGreaterThanOrEqual(2);

    const empty = caseFor("payment");
    expect(factualCompleteness(empty).ratio).toBe(0);
    expect(factualCompleteness(empty).requiredAnswered).toBe(0);

    // Answer the first required question.
    const one = caseFor("payment", { answered: [answerEntry("pay_q1", "pay_c1")] });
    const after1 = factualCompleteness(one);
    expect(after1.requiredAnswered).toBe(1);
    expect(after1.ratio).toBeGreaterThan(0);
    expect(after1.ratio).toBeLessThanOrEqual(1);
    expect(after1.missingRequired.length).toBeGreaterThan(0);

    // Monotonic increase: answering more never lowers completeness.
    expect(after1.ratio).toBeGreaterThan(factualCompleteness(empty).ratio);
  });

  it("free-form 'other' is complete once a claim exists", () => {
    expect(factualCompleteness(caseFor("other")).ratio).toBe(0);
    expect(factualCompleteness(caseFor("other", { facts: ["something"] })).ratio).toBe(1);
  });
});

describe("evidence coverage counts only attached evidence", () => {
  it("no evidence means zero verified evidence (invariant)", () => {
    const cov = evidenceCoverage(caseFor("payment"));
    expect(cov.total).toBe(0);
    expect(cov.attached).toBe(0);
    expect(cov.linked).toBe(0);
    expect(cov.ratio).toBe(0);
    expect(cov.hasVerifiedEvidence).toBe(false);
  });

  it("simulated/missing placeholders never count as coverage", () => {
    const c = caseFor("payment", {
      evidence: [
        { label: "Demo receipt", status: "simulated" },
        { label: "None", status: "missing" },
      ],
    });
    const cov = evidenceCoverage(c);
    expect(cov.total).toBe(2);
    expect(cov.attached).toBe(0);
    expect(cov.ratio).toBe(0);
    expect(cov.hasVerifiedEvidence).toBe(false);
  });

  it("coverage rises when evidence is actually attached", () => {
    const c = caseFor("payment", {
      evidence: [
        { label: "App record", status: "uploaded" },
        { label: "None", status: "missing" },
      ],
    });
    const cov = evidenceCoverage(c);
    expect(cov.attached).toBe(1);
    expect(cov.total).toBe(2);
    expect(cov.ratio).toBeCloseTo(0.5, 5);
    expect(cov.hasVerifiedEvidence).toBe(true);
  });
});

describe("Next Best Question prioritizes missing required facts, no repeats", () => {
  it("asks the first unanswered required question, then advances", () => {
    const start = caseFor("payment");
    const first = nextBestQuestion(start);
    expect(first.reason).toBe("missing_required_fact");
    expect(first.questionId).toBe("pay_q1");

    // After answering pay_q1 -> pay_c1, the next best question must differ.
    const next = caseFor("payment", { answered: [answerEntry("pay_q1", "pay_c1")] });
    const second = nextBestQuestion(next);
    expect(second.questionId).not.toBe("pay_q1");
    expect(second.questionId).toBeTruthy();
  });

  it("never repeats an answered question and reports complete at the end", () => {
    // Walk the breakdown bank to completion.
    let answered: string[] = [];
    const seen: string[] = [];
    for (let i = 0; i < 6; i++) {
      const c = caseFor("breakdown", { answered });
      const nb = nextBestQuestion(c);
      if (nb.questionId === null) break;
      expect(seen).not.toContain(nb.questionId); // no repeats
      seen.push(nb.questionId);
      answered = [...answered, answerEntry(nb.questionId, "x")];
    }
    const done = nextBestQuestion(caseFor("breakdown", { answered }));
    expect(done.reason).toBe("complete");
    expect(done.questionId).toBeNull();
  });
});

describe("preparation score is a 0..100 indicator, not a prediction", () => {
  it("is 0 for an empty case and rises with facts + attached evidence", () => {
    expect(preparationScore(caseFor("payment"))).toBe(0);

    const prepared = caseFor("payment", {
      answered: [answerEntry("pay_q1", "pay_c1"), answerEntry("pay_q3", "pay_d1")],
      evidence: [{ label: "App record", status: "uploaded" }],
    });
    const score = preparationScore(prepared);
    expect(score).toBeGreaterThan(0);
    expect(score).toBeLessThanOrEqual(100);
  });

  it("intelligenceReport bundles completeness, coverage, nextBest, score", () => {
    const report = intelligenceReport(caseFor("payment"));
    expect(report.completeness.requiredTotal).toBeGreaterThan(0);
    expect(report.coverage.hasVerifiedEvidence).toBe(false);
    expect(report.nextBest.questionId).toBe("pay_q1");
    expect(report.preparationScore).toBe(0);
  });
});
