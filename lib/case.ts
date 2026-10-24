/**
 * Core domain model, Case_Store, and status state machine for AppealFlow.
 *
 * This module is pure TypeScript with no React and no network I/O so it can be
 * unit-tested in isolation (Requirements 2, 4, 5, 8, 9). The only side effects
 * live in the Case_Store, which persists to localStorage when it is available
 * and otherwise degrades to an in-memory-only store (e.g. during tests/SSR).
 */

export type Scenario =
  | "payment"
  | "breakdown"
  | "unclear_sign"
  | "permit"
  | "street_cleaning"
  | "incorrect_ticket"
  | "extraordinary_circumstances"
  | "other";

export const SCENARIOS: Scenario[] = [
  "payment",
  "breakdown",
  "unclear_sign",
  "permit",
  "street_cleaning",
  "incorrect_ticket",
  "extraordinary_circumstances",
  "other",
];

export type CaseStatus =
  | "draft"
  | "ready"
  | "clarification_requested"
  | "responded"
  | "submission_unverified"
  | "simulated_outcome";

export const CASE_STATUSES: CaseStatus[] = [
  "draft",
  "ready",
  "clarification_requested",
  "responded",
  "submission_unverified",
  "simulated_outcome",
];

export type FactSource = "resident_answer" | "resident_edit" | "demo_seed";
export type VerificationStatus = "claimed" | "simulated" | "unverified";

export interface Fact {
  id: string;
  text: string;
  source: FactSource;
  verificationStatus: VerificationStatus;
}

export type EvidenceStatus = "uploaded" | "simulated" | "missing";

export interface Evidence {
  kind: string;
  label: string;
  notes?: string;
  status: EvidenceStatus;
}

export interface ClarificationQuestion {
  id: string;
  text: string;
  askedAt: string;
}

export interface ClarificationResponse {
  questionId: string;
  text: string;
  respondedAt: string;
}

export type ProvenanceKind =
  | "case_created"
  | "fact_added"
  | "fact_edited"
  | "fact_removed"
  | "evidence_added"
  | "evidence_status_changed"
  | "status_changed"
  | "draft_generated"
  | "clarification_requested"
  | "clarification_responded";

export interface ProvenanceEntry {
  id: string;
  kind: ProvenanceKind;
  summary: string;
  at: string;
  refId?: string;
}

export type ResidencyLanguage = "en" | "zh" | "es";

export interface AppealCase {
  caseId: string;
  isSynthetic: boolean;
  city: string;
  violationType: string;
  ticketDate: string;
  scenario: Scenario;
  residencyLanguage: ResidencyLanguage;
  statement: string;
  selectedFacts: Fact[];
  evidence: Evidence[];
  status: CaseStatus;

  // Added by the app (optional so raw demo JSON loads directly):
  draft?: string;
  hardshipContext?: string;
  originalLanguageExcerpt?: string;
  clarification?: ClarificationQuestion;
  clarificationResponse?: ClarificationResponse;
  provenance: ProvenanceEntry[];
  answeredQuestionIds: string[];
  /** UI flag: resident has chosen a scenario (so we stop showing the picker). */
  pickedScenario?: boolean;
}

/* --------------------------------------------------------------------------
 * ID + timestamp helpers (deterministic-friendly: callers may inject time)
 * ------------------------------------------------------------------------ */

let idCounter = 0;
export function makeId(prefix = "id"): string {
  idCounter += 1;
  // A collision-resistant-enough id for a single-browser demo.
  const rand = Math.random().toString(36).slice(2, 8);
  return `${prefix}_${Date.now().toString(36)}_${idCounter}_${rand}`;
}

function nowIso(): string {
  return new Date().toISOString();
}

export function provenance(
  kind: ProvenanceKind,
  summary: string,
  refId?: string
): ProvenanceEntry {
  return { id: makeId("prov"), kind, summary, at: nowIso(), refId };
}

/* --------------------------------------------------------------------------
 * Status state machine (Req 9.4, 9.5, 9.6, 7.5, 8.2)
 * ------------------------------------------------------------------------ */

export const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
  draft: ["ready"],
  ready: ["clarification_requested", "submission_unverified", "simulated_outcome"],
  clarification_requested: ["responded"],
  responded: ["ready", "clarification_requested"],
  submission_unverified: ["simulated_outcome"],
  simulated_outcome: [],
};

export function canTransition(from: CaseStatus, to: CaseStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Returns a new case with the status changed, appending a provenance entry.
 * Throws on an illegal transition (surfaced as an error state in the UI).
 */
export function transition(c: AppealCase, to: CaseStatus): AppealCase {
  if (!canTransition(c.status, to)) {
    throw new Error(`illegal transition ${c.status} -> ${to}`);
  }
  return {
    ...c,
    status: to,
    provenance: [
      ...c.provenance,
      provenance("status_changed", `Status changed from ${c.status} to ${to}`),
    ],
  };
}

/* --------------------------------------------------------------------------
 * Demo normalization (Req 2.2, 2.5, 10.5)
 * ------------------------------------------------------------------------ */

function asString(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}

function normalizeFact(raw: unknown, idx: number): Fact {
  const r = (raw ?? {}) as Record<string, unknown>;
  const source = r.source;
  const vs = r.verificationStatus;
  return {
    id: asString(r.id, `f${idx + 1}`),
    text: asString(r.text),
    source:
      source === "resident_answer" ||
      source === "resident_edit" ||
      source === "demo_seed"
        ? source
        : "demo_seed",
    verificationStatus:
      vs === "claimed" || vs === "simulated" || vs === "unverified"
        ? vs
        : "claimed",
  };
}

function normalizeEvidence(raw: unknown): Evidence {
  const r = (raw ?? {}) as Record<string, unknown>;
  const status = r.status;
  return {
    kind: asString(r.kind, "other"),
    label: asString(r.label, "Evidence"),
    notes: typeof r.notes === "string" ? r.notes : undefined,
    status:
      status === "uploaded" || status === "simulated" || status === "missing"
        ? status
        : "missing",
  };
}

const SCENARIO_SET = new Set<string>(SCENARIOS);
const STATUS_SET = new Set<string>(CASE_STATUSES);

/**
 * Normalizes a raw record (e.g. a demo_cases.json entry or a partial/corrupt
 * localStorage record) into a complete AppealCase. Unknown keys are dropped,
 * missing fields are defaulted, so the UI never crashes on bad data (Req 10.5).
 */
export function normalizeCase(raw: unknown): AppealCase {
  const r = (raw ?? {}) as Record<string, unknown>;
  const scenario = asString(r.scenario);
  const status = asString(r.status);
  const lang = asString(r.residencyLanguage);
  const facts = Array.isArray(r.selectedFacts) ? r.selectedFacts : [];
  const evidence = Array.isArray(r.evidence) ? r.evidence : [];

  return {
    caseId: asString(r.caseId, makeId("case")),
    isSynthetic: r.isSynthetic === true,
    city: asString(r.city, "Boston"),
    violationType: asString(r.violationType, "Parking citation"),
    ticketDate: asString(r.ticketDate),
    scenario: SCENARIO_SET.has(scenario) ? (scenario as Scenario) : "other",
    residencyLanguage:
      lang === "en" || lang === "zh" || lang === "es"
        ? (lang as ResidencyLanguage)
        : "en",
    statement: asString(r.statement),
    selectedFacts: facts.map(normalizeFact),
    evidence: evidence.map(normalizeEvidence),
    status: STATUS_SET.has(status) ? (status as CaseStatus) : "draft",
    draft: typeof r.draft === "string" ? r.draft : undefined,
    hardshipContext:
      typeof r.hardshipContext === "string" ? r.hardshipContext : undefined,
    originalLanguageExcerpt:
      typeof r.originalLanguageExcerpt === "string"
        ? r.originalLanguageExcerpt
        : undefined,
    clarification: normalizeClarification(r.clarification),
    clarificationResponse: normalizeClarificationResponse(
      r.clarificationResponse
    ),
    provenance: Array.isArray(r.provenance)
      ? (r.provenance as ProvenanceEntry[]).filter(
          (p) => p && typeof p === "object"
        )
      : [],
    answeredQuestionIds: Array.isArray(r.answeredQuestionIds)
      ? (r.answeredQuestionIds as unknown[]).map((x) => asString(x))
      : [],
    pickedScenario: r.pickedScenario === true,
  };
}

function normalizeClarification(raw: unknown): ClarificationQuestion | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.text !== "string") return undefined;
  return {
    id: asString(r.id, makeId("clar")),
    text: r.text,
    askedAt: asString(r.askedAt, nowIso()),
  };
}

function normalizeClarificationResponse(
  raw: unknown
): ClarificationResponse | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.text !== "string") return undefined;
  return {
    questionId: asString(r.questionId),
    text: r.text,
    respondedAt: asString(r.respondedAt, nowIso()),
  };
}

/* --------------------------------------------------------------------------
 * Pure case mutators — return a new case, append exactly one provenance entry
 * ------------------------------------------------------------------------ */

export function addFact(
  c: AppealCase,
  text: string,
  opts?: { source?: FactSource; verificationStatus?: VerificationStatus; id?: string }
): AppealCase {
  const fact: Fact = {
    id: opts?.id ?? makeId("f"),
    text,
    source: opts?.source ?? "resident_answer",
    verificationStatus: opts?.verificationStatus ?? "claimed",
  };
  return {
    ...c,
    selectedFacts: [...c.selectedFacts, fact],
    provenance: [
      ...c.provenance,
      provenance("fact_added", `Added claim: "${truncate(text)}"`, fact.id),
    ],
  };
}

export function editFact(c: AppealCase, id: string, text: string): AppealCase {
  let changed = false;
  const selectedFacts = c.selectedFacts.map((f) => {
    if (f.id !== id) return f;
    changed = true;
    return { ...f, text, source: "resident_edit" as FactSource };
  });
  if (!changed) return c;
  return {
    ...c,
    selectedFacts,
    provenance: [
      ...c.provenance,
      provenance("fact_edited", `Edited claim: "${truncate(text)}"`, id),
    ],
  };
}

export function removeFact(c: AppealCase, id: string): AppealCase {
  const exists = c.selectedFacts.some((f) => f.id === id);
  if (!exists) return c;
  return {
    ...c,
    selectedFacts: c.selectedFacts.filter((f) => f.id !== id),
    provenance: [
      ...c.provenance,
      provenance("fact_removed", `Removed a claim`, id),
    ],
  };
}

export function addEvidence(c: AppealCase, ev: Evidence): AppealCase {
  return {
    ...c,
    evidence: [...c.evidence, ev],
    provenance: [
      ...c.provenance,
      provenance(
        "evidence_added",
        `Added evidence: ${ev.label} (${ev.status})`
      ),
    ],
  };
}

export function setEvidenceStatus(
  c: AppealCase,
  index: number,
  status: EvidenceStatus
): AppealCase {
  if (index < 0 || index >= c.evidence.length) return c;
  const evidence = c.evidence.map((e, i) =>
    i === index ? { ...e, status } : e
  );
  return {
    ...c,
    evidence,
    provenance: [
      ...c.provenance,
      provenance(
        "evidence_status_changed",
        `Evidence "${c.evidence[index].label}" marked ${status}`
      ),
    ],
  };
}

export function setDraft(c: AppealCase, draft: string): AppealCase {
  return {
    ...c,
    draft,
    provenance: [
      ...c.provenance,
      provenance("draft_generated", "Generated appeal draft"),
    ],
  };
}

export function requestClarification(c: AppealCase, text: string): AppealCase {
  const q: ClarificationQuestion = {
    id: makeId("clar"),
    text,
    askedAt: nowIso(),
  };
  const transitioned = canTransition(c.status, "clarification_requested")
    ? transition(c, "clarification_requested")
    : c;
  return {
    ...transitioned,
    clarification: q,
    clarificationResponse: undefined,
    provenance: [
      ...transitioned.provenance,
      provenance(
        "clarification_requested",
        `Reviewer requested clarification: "${truncate(text)}"`,
        q.id
      ),
    ],
  };
}

export function respondClarification(c: AppealCase, text: string): AppealCase {
  if (!c.clarification) return c;
  const response: ClarificationResponse = {
    questionId: c.clarification.id,
    text,
    respondedAt: nowIso(),
  };
  const transitioned = canTransition(c.status, "responded")
    ? transition(c, "responded")
    : c;
  return {
    ...transitioned,
    clarificationResponse: response,
    provenance: [
      ...transitioned.provenance,
      provenance(
        "clarification_responded",
        `Resident responded: "${truncate(text)}"`,
        c.clarification.id
      ),
    ],
  };
}

function truncate(s: string, n = 60): string {
  return s.length > n ? `${s.slice(0, n - 1)}…` : s;
}

/* --------------------------------------------------------------------------
 * Case_Store — localStorage + in-memory cache + cross-route notification
 * ------------------------------------------------------------------------ */

const CASES_KEY = "appealflow:v1:cases";
const ACTIVE_KEY = "appealflow:v1:active";

type CaseMap = Record<string, AppealCase>;

let cache: CaseMap | null = null;
const listeners = new Set<() => void>();

function hasStorage(): boolean {
  try {
    return typeof window !== "undefined" && !!window.localStorage;
  } catch {
    return false;
  }
}

function readFromStorage(): CaseMap {
  if (!hasStorage()) return {};
  try {
    const raw = window.localStorage.getItem(CASES_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const out: CaseMap = {};
    for (const [k, v] of Object.entries(parsed)) {
      out[k] = normalizeCase(v);
    }
    return out;
  } catch {
    // Corrupt storage: start clean rather than crashing (Req 10.5).
    return {};
  }
}

function writeToStorage(map: CaseMap): void {
  if (!hasStorage()) return;
  try {
    window.localStorage.setItem(CASES_KEY, JSON.stringify(map));
  } catch {
    // Quota or serialization error — keep in-memory cache authoritative.
  }
}

function notify(): void {
  listeners.forEach((fn) => {
    try {
      fn();
    } catch {
      /* listener errors must not break the store */
    }
  });
}

export const CaseStore = {
  /** Force a re-read from storage on the next access (e.g. storage event). */
  invalidate(): void {
    cache = null;
  },

  loadAll(): CaseMap {
    if (cache === null) {
      cache = readFromStorage();
    }
    return cache;
  },

  get(caseId: string): AppealCase | undefined {
    return this.loadAll()[caseId];
  },

  save(c: AppealCase): void {
    const map = { ...this.loadAll(), [c.caseId]: c };
    cache = map;
    writeToStorage(map);
    notify();
  },

  remove(caseId: string): void {
    const map = { ...this.loadAll() };
    delete map[caseId];
    cache = map;
    writeToStorage(map);
    notify();
  },

  setActive(caseId: string): void {
    if (hasStorage()) {
      try {
        window.localStorage.setItem(ACTIVE_KEY, caseId);
      } catch {
        /* ignore */
      }
    }
    activeIdMemo = caseId;
    notify();
  },

  getActiveId(): string | undefined {
    if (hasStorage()) {
      try {
        const v = window.localStorage.getItem(ACTIVE_KEY);
        if (v) return v;
      } catch {
        /* ignore */
      }
    }
    return activeIdMemo;
  },

  getActive(): AppealCase | undefined {
    const id = this.getActiveId();
    return id ? this.get(id) : undefined;
  },

  /** Normalize a raw demo record into a stored case and make it active. */
  seedFromDemo(raw: unknown): AppealCase {
    const normalized = normalizeCase(raw);
    const seeded: AppealCase =
      normalized.provenance.length === 0
        ? {
            ...normalized,
            provenance: [
              provenance(
                "case_created",
                `Loaded ${normalized.isSynthetic ? "synthetic demo" : ""} case ${normalized.caseId}`.trim()
              ),
            ],
          }
        : normalized;
    this.save(seeded);
    this.setActive(seeded.caseId);
    return seeded;
  },

  subscribe(fn: () => void): () => void {
    listeners.add(fn);
    return () => {
      listeners.delete(fn);
    };
  },

  /** Test-only reset. */
  _reset(): void {
    cache = null;
    activeIdMemo = undefined;
    listeners.clear();
    if (hasStorage()) {
      try {
        window.localStorage.removeItem(CASES_KEY);
        window.localStorage.removeItem(ACTIVE_KEY);
      } catch {
        /* ignore */
      }
    }
  },
};

let activeIdMemo: string | undefined;
