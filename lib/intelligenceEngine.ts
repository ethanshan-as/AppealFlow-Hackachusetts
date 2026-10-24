/**
 * Case Intelligence Engine — lightweight, explainable, fully deterministic.
 *
 * This is DETERMINISTIC ANALYTICS, not machine learning and not LLM inference.
 * It trains no model, downloads no dataset, and predicts no appeal outcome.
 * Every number is computed from explicit rules over the actual AppealCase:
 *
 *   1. Factual completeness  — which explicitly-required facts for the chosen
 *                              scenario have been answered.
 *   2. Evidence coverage     — the share of attached (status "uploaded")
 *                              evidence; placeholders/simulated/missing never
 *                              count as coverage (P0 #2 invariant reused).
 *   3. Next Best Question     — the first unanswered required question for the
 *                              scenario, never repeating an answered one.
 *
 * These are CASE PREPARATION INDICATORS, NOT appeal-success predictions.
 */

import { AppealCase, Scenario } from "./case";
import { isEvidenceVerified } from "./caseInsights";
import { BRANCH_BANKS, nextQuestion } from "./questions";

/**
 * Explicit required fields per scenario. Each entry is a stable key plus the
 * question id in the branch bank that satisfies it. Kept intentionally small
 * (2–3 required facts) and tied to the real question flow so "answered" is
 * detected from answeredQuestionIds. Scenarios with a branch bank derive their
 * required set from that bank; "other" requires a free-text statement/claim.
 */
export interface RequiredFact {
  key: string;
  questionId: string;
}

/** Required facts = the branch-bank questions for the scenario, in order. */
export function requiredFactsFor(scenario: Scenario): RequiredFact[] {
  const bank = BRANCH_BANKS[scenario];
  if (!bank) return []; // "other" has no fixed required questions
  return bank
    .slice()
    .sort((a, b) => a.order - b.order)
    .map((q) => ({ key: q.id, questionId: q.id }));
}

/** The set of question ids the resident has answered (ignores choice part). */
function answeredQuestionSet(c: AppealCase): Set<string> {
  const set = new Set<string>();
  for (const entry of c.answeredQuestionIds) {
    const [qid] = entry.split(":");
    if (qid) set.add(qid);
  }
  return set;
}

export interface CompletenessResult {
  requiredTotal: number;
  requiredAnswered: number;
  /** 0..1 fraction; 1 when a scenario has no fixed required facts. */
  ratio: number;
  /** Required fact keys still unanswered, in priority order. */
  missingRequired: string[];
}

export function factualCompleteness(c: AppealCase): CompletenessResult {
  const required = requiredFactsFor(c.scenario);
  const answered = answeredQuestionSet(c);

  if (required.length === 0) {
    // Free-form "other": completeness is driven by having at least one claim.
    const hasClaim = c.selectedFacts.length > 0;
    return {
      requiredTotal: 1,
      requiredAnswered: hasClaim ? 1 : 0,
      ratio: hasClaim ? 1 : 0,
      missingRequired: hasClaim ? [] : ["statement"],
    };
  }

  const missingRequired = required
    .filter((r) => !answered.has(r.questionId))
    .map((r) => r.key);
  const requiredAnswered = required.length - missingRequired.length;

  return {
    requiredTotal: required.length,
    requiredAnswered,
    ratio: required.length === 0 ? 1 : requiredAnswered / required.length,
    missingRequired,
  };
}

export interface EvidenceCoverageResult {
  attached: number; // status === "uploaded" only
  linked: number; // attached evidence associated with the case
  total: number;
  /** 0..1 fraction of evidence actually attached. 0 when nothing attached. */
  ratio: number;
  hasVerifiedEvidence: boolean;
}

/**
 * Evidence coverage is computed ONLY from actually attached ("uploaded")
 * evidence. Placeholders (simulated) and missing items never contribute, so
 * "no evidence" always yields zero verified evidence (tested invariant).
 */
export function evidenceCoverage(c: AppealCase): EvidenceCoverageResult {
  const attached = c.evidence.filter(isEvidenceVerified).length;
  const total = c.evidence.length;
  return {
    attached,
    linked: attached,
    total,
    ratio: total === 0 ? 0 : attached / total,
    hasVerifiedEvidence: attached > 0,
  };
}

export type NextBestQuestionReason =
  | "missing_required_fact"
  | "complete";

export interface NextBestQuestion {
  reason: NextBestQuestionReason;
  /** The next question id to ask, or null when nothing is pending. */
  questionId: string | null;
}

/**
 * Deterministic Next Best Question selector. It prioritizes the first missing
 * REQUIRED fact (lowest-order unanswered branch question) and never repeats an
 * already-answered question. Returns null when the required set is complete.
 *
 * This reuses the pure nextQuestion() engine, which already returns the
 * lowest-order reachable unanswered question and is referentially stable.
 */
export function nextBestQuestion(c: AppealCase): NextBestQuestion {
  const q = nextQuestion(c);
  if (q) {
    return { reason: "missing_required_fact", questionId: q.id };
  }
  return { reason: "complete", questionId: null };
}

export interface IntelligenceReport {
  completeness: CompletenessResult;
  coverage: EvidenceCoverageResult;
  nextBest: NextBestQuestion;
  /** A single 0..100 "case preparation" indicator (NOT a success prediction). */
  preparationScore: number;
}

/**
 * A single explainable preparation indicator: the average of factual
 * completeness and evidence coverage, on a 0..100 scale. This measures how
 * ready the case is to present — it is explicitly NOT a prediction of whether
 * the appeal will succeed.
 */
export function preparationScore(c: AppealCase): number {
  const completeness = factualCompleteness(c).ratio;
  const coverage = evidenceCoverage(c).ratio;
  return Math.round(((completeness + coverage) / 2) * 100);
}

export function intelligenceReport(c: AppealCase): IntelligenceReport {
  return {
    completeness: factualCompleteness(c),
    coverage: evidenceCoverage(c),
    nextBest: nextBestQuestion(c),
    preparationScore: preparationScore(c),
  };
}
