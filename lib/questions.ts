/**
 * Guided branching Question_Engine (Req 3, 13).
 *
 * Deterministic by default: a pure function of the case selects the next
 * question from a scenario-specific Branch_Bank. The optional LLM path lives
 * in app/api/next-question and always falls back to this deterministic bank.
 *
 * Choices are deliberately descriptive of *situations*, never of outcomes or
 * eligibility, so no choice steers the resident toward a predetermined answer
 * (Req 3.6). Nothing is preselected (Req 3.5): the engine appends the neutral
 * "Other / not sure" choice at render time and the caller starts with no
 * selection.
 */

import { AppealCase, Scenario } from "./case";

export interface Choice {
  id: string;
  /** Translation key resolved via lib/translations.ts. */
  labelKey: string;
}

export interface BranchQuestion {
  id: string;
  scenario: Scenario;
  order: number;
  promptKey: string;
  choices: Choice[];
  /** choiceId -> next question id, or null to end the branch. */
  next?: Record<string, string | null>;
}

export const OTHER_CHOICE: Choice = {
  id: "other_not_sure",
  labelKey: "choice.other_not_sure",
};

/* -------------------------------------------------------------------------- */
/* payment flow (built) — 2–3 questions depending on branch                   */
/* -------------------------------------------------------------------------- */

const PAYMENT_BANK: BranchQuestion[] = [
  {
    id: "pay_q1",
    scenario: "payment",
    order: 1,
    promptKey: "q.pay_q1",
    choices: [
      { id: "pay_c1", labelKey: "q.pay_q1.c1" },
      { id: "pay_c2", labelKey: "q.pay_q1.c2" },
      { id: "pay_c3", labelKey: "q.pay_q1.c3" },
    ],
    next: { pay_c1: "pay_q2", pay_c2: "pay_q3", pay_c3: "pay_q3" },
  },
  {
    id: "pay_q2",
    scenario: "payment",
    order: 2,
    promptKey: "q.pay_q2",
    choices: [
      { id: "pay_r1", labelKey: "q.pay_q2.c1" },
      { id: "pay_r2", labelKey: "q.pay_q2.c2" },
      { id: "pay_r3", labelKey: "q.pay_q2.c3" },
    ],
    next: { pay_r1: "pay_q3", pay_r2: "pay_q3", pay_r3: "pay_q3" },
  },
  {
    id: "pay_q3",
    scenario: "payment",
    order: 3,
    promptKey: "q.pay_q3",
    choices: [
      { id: "pay_d1", labelKey: "q.pay_q3.c1" },
      { id: "pay_d2", labelKey: "q.pay_q3.c2" },
      { id: "pay_d3", labelKey: "q.pay_q3.c3" },
    ],
    next: { pay_d1: null, pay_d2: null, pay_d3: null },
  },
];

/* -------------------------------------------------------------------------- */
/* breakdown flow (built) — always 3 questions                                */
/* -------------------------------------------------------------------------- */

const BREAKDOWN_BANK: BranchQuestion[] = [
  {
    id: "brk_q1",
    scenario: "breakdown",
    order: 1,
    promptKey: "q.brk_q1",
    choices: [
      { id: "brk_c1", labelKey: "q.brk_q1.c1" },
      { id: "brk_c2", labelKey: "q.brk_q1.c2" },
    ],
    next: { brk_c1: "brk_q2", brk_c2: "brk_q2" },
  },
  {
    id: "brk_q2",
    scenario: "breakdown",
    order: 2,
    promptKey: "q.brk_q2",
    choices: [
      { id: "brk_a1", labelKey: "q.brk_q2.c1" },
      { id: "brk_a2", labelKey: "q.brk_q2.c2" },
      { id: "brk_a3", labelKey: "q.brk_q2.c3" },
    ],
    next: { brk_a1: "brk_q3", brk_a2: "brk_q3", brk_a3: "brk_q3" },
  },
  {
    id: "brk_q3",
    scenario: "breakdown",
    order: 3,
    promptKey: "q.brk_q3",
    choices: [
      { id: "brk_t1", labelKey: "q.brk_q3.c1" },
      { id: "brk_t2", labelKey: "q.brk_q3.c2" },
      { id: "brk_t3", labelKey: "q.brk_q3.c3" },
    ],
    next: { brk_t1: null, brk_t2: null, brk_t3: null },
  },
];

export const BRANCH_BANKS: Partial<Record<Scenario, BranchQuestion[]>> = {
  payment: PAYMENT_BANK,
  breakdown: BREAKDOWN_BANK,
};

/** Scenarios that are fully built with a branch bank. */
export const BUILT_SCENARIOS: Scenario[] = ["payment", "breakdown"];

/** Scenarios that route through the informational stub flow (Req 3.3). */
export const STUB_SCENARIOS: Scenario[] = [
  "unclear_sign",
  "extraordinary_circumstances",
  "other",
];

/** Single informational step for the three stubbed scenarios (Req 3.3). */
export const STUB_FLOW = {
  id: "stub_step",
  promptKey: "q.stub",
} as const;

export function isStubScenario(scenario: Scenario): boolean {
  return STUB_SCENARIOS.includes(scenario);
}

/* -------------------------------------------------------------------------- */
/* Deterministic selection                                                    */
/* -------------------------------------------------------------------------- */

function bankFor(scenario: Scenario): BranchQuestion[] | null {
  return BRANCH_BANKS[scenario] ?? null;
}

export function questionById(
  scenario: Scenario,
  id: string
): BranchQuestion | undefined {
  return bankFor(scenario)?.find((q) => q.id === id);
}

/**
 * Compute the set of question ids reachable from the resident's answered
 * choices. The first question (order 1) is always reachable.
 */
function reachableIds(c: AppealCase, bank: BranchQuestion[]): Set<string> {
  const reachable = new Set<string>();
  const first = bank.find((q) => q.order === 1);
  if (first) reachable.add(first.id);

  // Expand reachability using answered questions' chosen next-targets.
  // answeredQuestionIds stores "<questionId>:<choiceId>" entries.
  for (const entry of c.answeredQuestionIds) {
    const [qid, cid] = entry.split(":");
    const q = bank.find((x) => x.id === qid);
    if (!q || !q.next || !cid) continue;
    const target = q.next[cid];
    if (target) reachable.add(target);
  }
  return reachable;
}

function answeredQuestionIds(c: AppealCase): Set<string> {
  const set = new Set<string>();
  for (const entry of c.answeredQuestionIds) {
    const [qid] = entry.split(":");
    if (qid) set.add(qid);
  }
  return set;
}

/**
 * Pure next-question selector. Returns the lowest-order reachable question
 * that has not yet been answered, or null when the branch is complete or the
 * scenario is stubbed. Same case -> same question (referential determinism).
 */
export function nextQuestion(c: AppealCase): BranchQuestion | null {
  const bank = bankFor(c.scenario);
  if (!bank) return null; // stub scenarios have no branch questions

  const reachable = reachableIds(c, bank);
  const answered = answeredQuestionIds(c);

  const candidates = bank
    .filter((q) => reachable.has(q.id) && !answered.has(q.id))
    .sort((a, b) => a.order - b.order);

  return candidates[0] ?? null;
}

/** The choices a question presents, including the appended "Other" choice. */
export function presentedChoices(q: BranchQuestion): Choice[] {
  return [...q.choices, OTHER_CHOICE];
}

/** Count of built questions presented for a completed branch path. */
export function totalQuestionsFor(scenario: Scenario): number {
  return bankFor(scenario)?.length ?? 0;
}

/**
 * Record an answer: returns the answer entry string to append to
 * answeredQuestionIds. Keeping this a pure helper lets the UI and tests share
 * the exact progression logic.
 */
export function answerEntry(questionId: string, choiceId: string): string {
  return `${questionId}:${choiceId}`;
}
