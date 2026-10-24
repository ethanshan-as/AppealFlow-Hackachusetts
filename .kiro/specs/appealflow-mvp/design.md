# Design Document

## Overview

AppealFlow is a single Next.js (App Router) + TypeScript + Tailwind project that serves both the Resident and Reviewer experiences from one browser, sharing case state through a `Case_Store` abstraction backed by `localStorage` plus an in-memory cache. There is no database and no authentication. Pure domain logic lives in `lib/` and is unit-testable in isolation; React components are thin views over that logic. Two server-side API routes (`/api/next-question`, `/api/appeal`) optionally call an LLM when `OPENAI_API_KEY` and `OPENAI_MODEL` are present, and always fall back to deterministic logic under a timeout. No API key is ever exposed to the browser.

### Mapping to the vertical-slice priority

The design is layered so the priority-1 slice (Requirements 1–10) is fully functional on its own, with later-priority features (Req 11–13) added as isolated, additive modules and cross-cutting guarantees (Req 14–15) enforced inside the shared `lib/` logic.

| Layer | Requirements | Status in MVP |
| --- | --- | --- |
| Landing + routing + independence notice | 1 | Priority 1 |
| Case initiation (demo cases, manual entry, no PII) | 2 | Priority 1 |
| Guided branching flow (payment + breakdown built; 3 scenarios stubbed) | 3 | Priority 1 |
| Editable fact review | 4 | Priority 1 |
| Evidence metadata + provenance | 5 | Priority 1 |
| Deterministic draft generation (+ optional LLM) | 6 | Priority 1 (LLM optional) |
| Reviewer neutral view | 7 | Priority 1 |
| Two-way clarification loop | 8 | Priority 1 |
| Output, submission framing, statuses | 9 | Priority 1 |
| Accessibility, responsiveness, no-key operation | 10 | Priority 1 |
| Trilingual UI | 11 | Later priority |
| Voice input/output | 12 | Later priority |
| Optional LLM question selection | 13 | Later priority |
| Official sources + fairness safeguards | 14 | Cross-cutting (enforced in `lib/`) |
| Verification tests | 15 | Cross-cutting (Vitest over `lib/`) |

## Architecture

The system is a single Next.js App Router project. The browser hosts both roles as separate route trees that share one `Case_Store`; pure domain logic is isolated in `lib/`; two server-only API routes provide optional LLM augmentation with deterministic fallback.

```
Browser (single user)
 ┌───────────────────────────────────────────────────────────────┐
 │  Resident routes            Reviewer routes                      │
 │  /resident/*                /reviewer/*                          │
 │     │                           │                                │
 │     ├── ResidentWizard          ├── ReviewerDashboard            │
 │     ├── CaseTimeline            ├── CaseTimeline                  │
 │     └── LanguageSwitcher        └── LanguageSwitcher             │
 │             │                           │                        │
 │             └──────────► Case_Store ◄────┘   (localStorage +     │
 │                            │                  in-memory cache +   │
 │                            │                  storage events)     │
 │        lib/ (pure logic, no React, no I/O):                      │
 │        questions.ts · case.ts · templates.ts ·                   │
 │        translations.ts · rules.ts                               │
 └───────────────┬───────────────────────────────┬────────────────┘
                 │ fetch (confirmed facts only)   │
        ┌────────▼─────────┐            ┌──────────▼─────────┐
        │ /api/next-question│            │    /api/appeal     │
        │ (server, optional │            │ (server, optional  │
        │  LLM, fallback)   │            │  LLM, fallback)    │
        └───────────────────┘            └────────────────────┘
                 (OPENAI_API_KEY / OPENAI_MODEL read server-side only)
```

## Data Models

All types live in `lib/case.ts` (and are re-exported where convenient). Shapes match the existing `data/demo_cases.json` and `data/official_sources.json` exactly.

```typescript
export type Scenario =
  | "payment"
  | "breakdown"
  | "unclear_sign"
  | "extraordinary_circumstances"
  | "other";

export type CaseStatus =
  | "draft"
  | "ready"
  | "clarification_requested"
  | "responded"
  | "submission_unverified"
  | "simulated_outcome";

export type FactSource = "resident_answer" | "resident_edit" | "demo_seed";
export type VerificationStatus = "claimed" | "simulated" | "unverified";

export interface Fact {
  id: string;
  text: string;
  source: FactSource;              // resident_answer for guided answers
  verificationStatus: VerificationStatus; // claimed for guided answers
}

export type EvidenceStatus = "uploaded" | "simulated" | "missing";

export interface Evidence {
  kind: string;        // e.g. "payment_receipt", "tow_receipt"
  label: string;
  notes?: string;
  status: EvidenceStatus;
}

export interface ClarificationQuestion {
  id: string;
  text: string;
  askedAt: string;     // ISO timestamp
}

export interface ClarificationResponse {
  questionId: string;
  text: string;
  respondedAt: string; // ISO timestamp
}

export type ProvenanceKind =
  | "fact_added"
  | "fact_edited"
  | "fact_removed"
  | "evidence_added"
  | "evidence_status_changed"
  | "status_changed"
  | "clarification_requested"
  | "clarification_responded";

export interface ProvenanceEntry {
  id: string;
  kind: ProvenanceKind;
  summary: string;          // neutral human-readable summary
  at: string;               // ISO timestamp
  refId?: string;           // fact/evidence id when applicable
}

export interface AppealCase {
  caseId: string;
  isSynthetic: boolean;
  city: string;
  violationType: string;
  ticketDate: string;
  scenario: Scenario;
  residencyLanguage: "en" | "zh" | "es";
  statement: string;
  selectedFacts: Fact[];
  evidence: Evidence[];
  status: CaseStatus;

  // Added by the app (optional so demo JSON loads directly):
  draft?: string;
  hardshipContext?: string;          // voluntarily disclosed; never scored
  originalLanguageExcerpt?: string;  // for Reviewer Req 7.3
  clarification?: ClarificationQuestion;
  clarificationResponse?: ClarificationResponse;
  provenance: ProvenanceEntry[];     // append-only
  answeredQuestionIds: string[];     // drives branch progression
}
```

Notes:
- The demo JSON files omit `draft`, `provenance`, and `answeredQuestionIds`; `Case_Store.load()` normalizes a raw demo record into a full `AppealCase` by defaulting these fields (`provenance: []`, `answeredQuestionIds: []`).
- `Official_Source` type mirrors `data/official_sources.json`: `{ id, title, url, purpose, verificationNote }`. Loaded read-only by `rules.ts`.
- PII fields (plate, ticket number, name, barcode) are intentionally **absent** from the model — there is nowhere to store them (Req 2.4, 14).

## Components and Interfaces

The sections below define each component's responsibilities and interfaces: `Case_Store` (shared state), `Question_Engine` (guided flow), `Draft_Generator` (appeal text), the `Case_Status` state machine, the Reviewer view and clarification flow, translations, voice, and the two API route contracts.

### Case_Store (`lib/case.ts`)

A framework-agnostic module with a thin React hook wrapper so both roles observe the same state.

#### Responsibilities
- Single source of truth for the active case and for a list of known cases.
- Persist to `localStorage` under a versioned key (`appealflow:v1:cases`, `appealflow:v1:active`).
- Keep an in-memory cache to avoid JSON parse on every read.
- Broadcast changes across routes in the same browser.

#### Persistence + cross-route sharing

```typescript
const CASES_KEY = "appealflow:v1:cases";
const ACTIVE_KEY = "appealflow:v1:active";

// In-memory cache
let cache: Record<string, AppealCase> | null = null;

export const CaseStore = {
  loadAll(): Record<string, AppealCase> { /* parse localStorage once, cache */ },
  get(caseId: string): AppealCase | undefined { /* from cache */ },
  save(c: AppealCase): void {
    // 1. update cache  2. write JSON to localStorage  3. notify subscribers
  },
  setActive(caseId: string): void { /* write ACTIVE_KEY */ },
  getActive(): AppealCase | undefined { /* read ACTIVE_KEY -> get */ },
  seedFromDemo(raw: unknown): AppealCase { /* normalize demo record */ },
  subscribe(fn: () => void): () => void { /* set of listeners */ },
};
```

Cross-route synchronization uses two mechanisms, both simple and single-browser safe:
1. **`storage` event:** Resident and Reviewer run in the same browser. When one route calls `CaseStore.save()`, the other route's `window.addEventListener("storage", ...)` fires (storage events fire in other documents of the same origin), invalidating the cache and re-reading.
2. **Re-read on focus/visibility:** `visibilitychange` and `focus` handlers invalidate the cache and re-read, covering same-tab navigation where `storage` does not fire.

A React hook `useCase(caseId?)` subscribes to `CaseStore` and to `storage`/`focus`, returning the current case and typed mutators (`addFact`, `editFact`, `removeFact`, `addEvidence`, `setEvidenceStatus`, `setStatus`, `requestClarification`, `respondClarification`). Every mutator appends a `ProvenanceEntry` and then calls `save()`.

#### Serialization
- State is plain JSON — `AppealCase` is composed only of JSON-safe primitives, arrays, and objects. `JSON.stringify` / `JSON.parse` round-trips losslessly.
- Load performs a shallow schema normalization (fill defaults, drop unknown keys) so malformed or partial records never crash the UI (Req 10.5 error state).

### Question_Engine (`lib/questions.ts`)

Deterministic by default; optionally augmented by the LLM via `/api/next-question`.

#### Branch_Bank structure

```typescript
export interface Choice {
  id: string;
  // translation keys resolved via translations.ts
  labelKey: string;
}

export interface BranchQuestion {
  id: string;
  scenario: Scenario;
  order: number;
  promptKey: string;         // translation key
  choices: Choice[];         // 2-4 neutral choices
  // "Other / not sure" is appended by the engine, not stored per question
  // optional branching: which next question id a given choice leads to
  next?: Record<string, string | null>; // choiceId -> next question id | null (end)
}

export const OTHER_CHOICE: Choice = { id: "other_not_sure", labelKey: "choice.other_not_sure" };
```

The engine always appends `OTHER_CHOICE` at render time, guaranteeing every presented question has 2–4 neutral choices **plus** "Other / not sure" (Req 3.4) and that nothing is preselected (Req 3.5 — initial selection is `null`).

#### `payment` flow (built, 3 questions → 2–4 presented depending on branch)

- **pay_q1 — "What happened with your parking payment?"**
  - `pay_c1` "I believe I paid and have a record" → pay_q2
  - `pay_c2` "I believe I paid but have no record" → pay_q3
  - `pay_c3` "I am not sure whether payment went through" → pay_q3
- **pay_q2 — "What kind of payment record can you show?"**
  - `pay_r1` "App or card transaction record"
  - `pay_r2` "Paper or meter receipt"
  - `pay_r3` "Account or statement entry"
- **pay_q3 — "What detail on the ticket do you want to compare?"**
  - `pay_d1` "The time on the ticket"
  - `pay_d2` "The zone or space number"
  - `pay_d3` "The date on the ticket"

Minimum path length (e.g. pay_c2 → pay_q3) = 2 questions; maximum = 3. All within the 2–4 bound (Req 3.2).

#### `breakdown` flow (built)

- **brk_q1 — "What best describes the vehicle situation?"**
  - `brk_c1` "The vehicle would not start or move" → brk_q2
  - `brk_c2` "The vehicle had a safety issue I was addressing" → brk_q2
- **brk_q2 — "Did you arrange any assistance?"**
  - `brk_a1` "I contacted a tow service" → brk_q3
  - `brk_a2` "I contacted roadside assistance" → brk_q3
  - `brk_a3` "I did not arrange assistance yet" → brk_q3
- **brk_q3 — "What can you show about the time involved?"**
  - `brk_t1` "A receipt or service record with a time"
  - `brk_t2` "A message or call log with a time"
  - `brk_t3` "No time record is available"

All paths present exactly 3 questions (Req 3.2).

Choices are deliberately descriptive of situations, never of outcomes or eligibility, so no choice steers toward a predetermined answer (Req 3.6). This neutrality is editorial and is guarded by the neutral-choice-count property plus a steering standard, not by a semantic test.

#### Stubbed scenarios (Req 3.3)

`unclear_sign`, `extraordinary_circumstances`, and `other` map to a single `STUB_FLOW` that returns one informational step indicating the scenario is not yet fully implemented in the MVP and routes the resident to free-text statement + evidence + draft. No branch questions are defined for them.

#### Deterministic selection

```typescript
export function nextQuestion(c: AppealCase): BranchQuestion | null {
  // 1. pick scenario bank (payment/breakdown) or null for stub
  // 2. among unanswered questions reachable from answered choices,
  //    return the lowest-order reachable question; null when branch complete
}
```

`nextQuestion` is a **pure** function of the case. Same case → same question (Req 13.4, deterministic). When a choice is submitted, the engine records the `answeredQuestionIds` entry and `addFact` derives a `Fact` with `source: "resident_answer"`, `verificationStatus: "claimed"`, and `text` resolved from the chosen `labelKey` in the resident's current language (English text stored; display translated).

#### Optional LLM path (Req 13, later priority)

`Question_Engine.selectNext(c)` consults the server route only when the client is told credentials exist (a server-provided boolean flag; the key itself never reaches the browser):

```
client → POST /api/next-question { scenario, confirmedFacts[], answeredQuestionIds }
server → validates OPENAI_API_KEY + OPENAI_MODEL present
       → sends only confirmed, redacted structured context to the LLM
       → expects strict JSON: { prompt, choices: [2..4], } (+ Other appended)
       → validates against a JSON schema (zod)
```

Fallback to `nextQuestion()` (deterministic Branch_Bank) occurs on **any** of:
- missing credentials (route returns `{ source: "deterministic" }`),
- invalid JSON / schema validation failure,
- **invented premise**: any returned choice/prompt that references a fact, law, document, or case id not present in the submitted confirmed context (checked by `rules.assertNoFabrication`),
- timeout (server aborts the LLM call via `AbortController` after `LLM_TIMEOUT_MS`, default 8000; client also has its own fetch timeout).

The engine treats the LLM purely as an optional reordering/rewording of a question; if validation fails it silently uses the deterministic bank, so the demo is identical with or without a key.

### Draft_Generator (`lib/templates.ts`)

#### Deterministic template

```typescript
export function generateDraft(c: AppealCase, lang: "en" = "en"): string {
  const facts = c.selectedFacts;             // only confirmed facts (Req 4.4)
  // Structure:
  //  - Neutral heading referencing city + violationType + ticketDate (from case, not invented)
  //  - "I am writing to appeal..." framing
  //  - One bullet per confirmed Fact, using Fact.text verbatim
  //  - Evidence summary: list Evidence.label + status (uploaded/simulated/missing)
  //  - Closing: respectful request for review; explicit note that supporting
  //    documents will be provided; NO probability/guarantee language
}
```

The draft is always English (Req 6.1). It is assembled **only** from fields already present on the case: `city`, `violationType`, `ticketDate`, confirmed `selectedFacts`, and `evidence`. It never introduces a law, statute, code, case id, date, or document that is not already in those inputs.

#### Forbidden content rules (enforced via `rules.ts`)

`rules.assertNoFabrication(draft, allowedTokens)` and `rules.assertNoOutcomeClaims(draft)` run on generator output:
- **No fabricated law/code/case id:** reject tokens matching legal-citation patterns (e.g. `MGL`, `c.\s*\d+`, `§`, statute/ordinance numbers) and case-id patterns not present in `allowedTokens` derived from the confirmed facts/case (Req 6.3, 14.3).
- **No outcome/probability claims:** reject phrases implying win probability or guaranteed result (e.g. "guarantee", "will win", "certainly", "X% chance", "you will succeed") (Req 6.4).
- **Verify-on-official-site labeling:** any Official_Source citation rendered alongside the draft/reviewer view carries the `verificationNote` as a "verify on official site" indication (Req 14.2).

If generator output fails either assertion, the generator strips the offending segment and regenerates from the safe template (defensive; the deterministic template is designed to never emit such content).

#### Optional Appeal_Service path + fallback (Req 6.2, 6.6)

```
client → POST /api/appeal { city, violationType, ticketDate, confirmedFacts[], evidence[] }
server → if OPENAI_API_KEY + OPENAI_MODEL: produce draft from ONLY those inputs
       → run rules.assertNoFabrication / assertNoOutcomeClaims server-side
       → return { draft, source: "llm" }
       → on throw / invalid / timeout / assertion failure:
            return { draft: generateDraft(...), source: "deterministic" }
```

The client calls the service; if the response is missing, invalid, or `source !== "llm"`, or the fetch times out, the client calls `generateDraft()` locally. The deterministic path is the guaranteed default (Req 6.6, 10.6).

### Case_Status state machine (`lib/case.ts`)

Allowed transitions (anything not listed is rejected; every result is one of the six allowed statuses, Req 9.4):

```
draft ──────────────► ready                     (draft generated / confirmed)
ready ──────────────► clarification_requested    (reviewer requests clarification)
clarification_requested ─► responded             (resident responds)
responded ──────────► ready                      (reviewer re-reviews)
responded ──────────► clarification_requested    (reviewer asks again)
ready ──────────────► submission_unverified      (resident exports; not a submitted state)
submission_unverified ─► simulated_outcome       (reviewer records demo outcome, human click)
ready ──────────────► simulated_outcome          (reviewer records demo outcome, human click)
```

```typescript
const TRANSITIONS: Record<CaseStatus, CaseStatus[]> = {
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
export function transition(c: AppealCase, to: CaseStatus): AppealCase {
  if (!canTransition(c.status, to)) throw new Error(`illegal transition ${c.status}->${to}`);
  // append provenance status_changed, return updated case
}
```

- There is **no** transition into any "submitted"/accepted state; the closest is `submission_unverified` (export happened, receipt unverified) and `simulated_outcome` (explicitly labeled demo, requires a human click) (Req 9.5, 9.6).
- `simulated_outcome` is terminal.

### Reviewer view (`ReviewerDashboard`) and clarification flow

#### Structure (Req 7)
`ReviewerDashboard` renders, for the active case, clearly separated sections:
1. **Claims** — confirmed `selectedFacts`, each with `source` + `verificationStatus` badges.
2. **Evidence** — rendered in a distinct panel labeled separately from claims, each with `kind`, `label`, `status`.
3. **Missing information** — derived gaps (evidence with `status: "missing"`, unanswered reachable branch questions).
4. **Official sources** — citations from `rules.officialSources()`, each with its `verificationNote` ("verify on official site").
5. **Hardship context** — if `hardshipContext` present, shown as plain information with **no numeric score** (Req 7.2, 14.4).
6. **Original-language excerpt** — if `originalLanguageExcerpt` present (Req 7.3).
7. **What remains uncertain** — explicit uncertainty statement derived from missing info (Req 7.4).
8. **Provenance timeline** — `CaseTimeline` over `provenance` (shared with resident, Req 8.4).

#### Clarification flow (Req 7.5, 8)
- Reviewer clicks **Request Clarification**, enters one question → `requestClarification(text)` stores a single `ClarificationQuestion` and transitions status to `clarification_requested`, appending provenance.
- Resident route, while status is `clarification_requested`, surfaces the question (Req 8.1). Resident submits a response → `respondClarification(text)` stores `ClarificationResponse` and transitions to `responded` (Req 8.2).
- Because both routes read the same `Case_Store` and re-read on `storage`/`focus`, each side sees the other's updates (Req 8.3). The provenance timeline is identical on both sides (Req 8.4).

### Trilingual translations (`lib/translations.ts`, Req 11 — later priority)

```typescript
export type Lang = "en" | "zh" | "es";
export type Dict = Record<string, string>;
export const translations: Record<Lang, Dict>; // keyed by promptKey/labelKey/UI keys
export function t(lang: Lang, key: string): string; // falls back to en, then key
```

- Every Branch_Bank `promptKey` and `labelKey` has an entry in all three dictionaries (Req 11.2) — enforced by a correctness property/test.
- `LanguageSwitcher` sets the active `Lang` in a lightweight context; changing language re-renders labels only and never mutates `Case_Store` (Req 11.3). Case state is independent of UI language.
- Generated draft text stays English (Req 6.1); UI chrome and question text translate.

### Voice (`lib/` thin wrappers + components, Req 12 — later priority)

- **Input:** feature-detect `window.SpeechRecognition || window.webkitSpeechRecognition`. When present, a mic control captures speech into an **editable transcript** the resident confirms before it becomes an answer/fact (Req 12.1). Mic use triggers the browser permission prompt (Req 12.4).
- **Fallback:** every question always renders its normal choice buttons / text entry regardless of speech support (Req 12.2).
- **Output:** feature-detect `window.speechSynthesis`; when present, a Read Aloud control speaks the current question using the voice matching the active `Lang` (`en`/`zh-CN`/`es`), gracefully hidden when unsupported (Req 12.3).

### API route contracts

#### `POST /api/next-question`
Request:
```json
{
  "scenario": "payment",
  "confirmedFacts": [{ "id": "f1", "text": "...", "source": "resident_answer", "verificationStatus": "claimed" }],
  "answeredQuestionIds": ["pay_q1"]
}
```
Response (LLM available and valid):
```json
{
  "source": "llm",
  "question": {
    "id": "llm_q",
    "promptText": "…",
    "choices": [{ "id": "c1", "label": "…" }, { "id": "c2", "label": "…" }]
  }
}
```
Response (no key / invalid / invented premise / timeout):
```json
{ "source": "deterministic" }
```
Server appends "Other / not sure" to any returned choices and never returns more than 4 base choices (Req 13.1). Server reads `OPENAI_API_KEY`/`OPENAI_MODEL` from `process.env` only (Req 6.5).

#### `POST /api/appeal`
Request:
```json
{
  "city": "Boston",
  "violationType": "Parking meter payment dispute",
  "ticketDate": "2026-10-10",
  "confirmedFacts": [{ "id": "f1", "text": "...", "source": "resident_answer", "verificationStatus": "claimed" }],
  "evidence": [{ "kind": "payment_receipt", "label": "…", "status": "missing" }]
}
```
Response:
```json
{ "source": "llm" | "deterministic", "draft": "…English draft…" }
```
Server runs anti-fabrication + no-outcome assertions on any LLM draft and falls back to the deterministic template on any failure (Req 6.2, 6.6).

Both routes enforce a server-side `AbortController` timeout (`LLM_TIMEOUT_MS`, default 8000 ms) and send only confirmed, minimally necessary, redacted structured context to the LLM (Req 13.2).

## Security and fairness enforcement points (Req 14)

| Guard | Where enforced |
| --- | --- |
| API key never in browser (code/network/logs) (6.5) | Key read only in `/api/*` route handlers via `process.env`; client receives at most a boolean "llm available" flag; no key in any client bundle or log |
| Citations only from `official_sources.json` (14.1) | `rules.officialSources()` is the sole citation source; UI renders nothing else |
| "Verify on official site" labeling (14.2) | Each rendered source carries its `verificationNote`; unverified rules labeled |
| No fabricated facts/laws/case ids/documents (14.3, 6.3) | `rules.assertNoFabrication` runs on all generated content (deterministic draft + any LLM output) server- and client-side |
| No win-probability / guaranteed outcome (6.4) | `rules.assertNoOutcomeClaims` on draft output |
| Hardship never scored / auto-approval / protected proxy (14.4) | No numeric hardship field exists in the model; reviewer renders it as plain text; no status transition is driven by hardship |
| No PII captured (2.4) | No PII fields in `AppealCase`; no PII inputs in any form |

## Error Handling

The system is designed to degrade gracefully and never block the no-key demo flow (Req 10.4, 10.5, 10.6).

| Failure | Handling |
| --- | --- |
| LLM credentials absent | Routes return `{ source: "deterministic" }`; engine/generator use deterministic logic (Req 13.4, 6.1) |
| LLM returns invalid JSON / schema failure | Server validation (zod) fails → deterministic fallback (Req 13.3, 6.6) |
| LLM returns an invented premise | `rules.assertNoFabrication` rejects → deterministic fallback (Req 13.3, 14.3) |
| LLM call times out | Server `AbortController` (`LLM_TIMEOUT_MS`, default 8000 ms) aborts; client fetch has its own timeout; both fall back deterministically (Req 13.3, 6.6) |
| Draft would contain outcome/probability or fabricated tokens | `rules.assertNoOutcomeClaims` / `assertNoFabrication` strip and regenerate from the safe template (Req 6.3, 6.4) |
| Corrupt / partial `localStorage` record | `Case_Store.load()` normalizes with defaults and drops unknown keys; UI shows an error state rather than crashing (Req 10.5) |
| Illegal status transition requested | `transition()` throws; UI surfaces an error state and leaves status unchanged (Req 9.4, 10.5) |
| Async operation in progress | Components render a loading state until resolved (Req 10.4) |
| Speech recognition / synthesis unsupported | Feature detection hides the control; text entry and on-screen question text remain (Req 12.2) |
| Clipboard / download unsupported | Fallback: show selectable text / data-URL anchor; surface an error state if even that fails (Req 9.1, 9.2, 10.5) |

All server routes return structured JSON with an explicit `source` discriminator so the client can deterministically decide whether to trust LLM output or fall back. No API key, stack trace, or LLM error detail is ever returned to the browser or logged client-side (Req 6.5).

## Testing Strategy

Framework: Vitest (run with `vitest --run`). This section maps to Requirement 15.

Tests target `lib/` pure logic (no React, no network), run with `vitest --run`. A property-testing helper (`fast-check`) is used where inputs vary meaningfully; example tests cover specific scenarios. Minimum 100 iterations per property test; each property test is tagged `Feature: appealflow-mvp, Property N: <text>`.

Required tests (mapping to Req 15 acceptance criteria):
1. **Branch flow** (15.2): walk `payment` and `breakdown` banks over all answer paths; assert 2–4 questions presented, one at a time, and that every presented question has 2–4 neutral choices plus "Other / not sure". (Properties 1, 2.)
2. **Fact provenance** (15.3): for random (question, choice) answers, assert each generated `Fact` carries `source: "resident_answer"` and `verificationStatus: "claimed"`. (Property 3.)
3. **Status transitions** (15.4): assert `canTransition`/`transition` accept exactly the allowed edges, reject all others, and every result is one of the six allowed statuses. (Property 9.)
4. **No fabricated laws/case ids** (15.5): for random confirmed fact sets with no legal/case-id tokens, assert the deterministic draft contains none and no outcome/probability language. (Properties 6, 7.)
5. **Deterministic fallback** (15.6): with no credentials configured, assert `Question_Engine` selects the deterministic Branch_Bank and is referentially stable (same case → same question); and that `/api/appeal`/`/api/next-question` failures fall back to deterministic output. (Properties 8, 11.)

Dual approach: property tests cover universal invariants above; example/unit tests cover demo-case loading, store round-trip, stub-scenario routing, and reviewer-view section presence.

## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system — essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Built scenarios present 2–4 sequential questions

*For any* starting case in the `payment` or `breakdown` scenario and *any* sequence of valid choice selections, the Question_Engine presents between 2 and 4 Branch_Bank questions, one at a time, until the branch completes.

**Validates: Requirements 3.2**

### Property 2: Every presented question is neutral, bounded, and unselected

*For any* question presented by the Question_Engine, it offers between 2 and 4 neutral answer choices plus exactly one "Other / not sure" choice, with no choice preselected before the resident responds.

**Validates: Requirements 3.4, 3.5**

### Property 3: Answers produce provenance-tagged facts

*For any* question and *any* selected choice, submitting the answer adds a Fact whose `source` is `resident_answer` and whose `verificationStatus` is `claimed`, with a non-empty id and text.

**Validates: Requirements 3.7**

### Property 4: Case_Store round-trip preserves state

*For any* case and *any* sequence of add-fact, edit-fact, remove-fact, and add-evidence operations, serializing to and reloading from the Case_Store yields a case equal to the in-memory result, with edits and removals reflected and persisted.

**Validates: Requirements 4.2, 4.3, 5.1**

### Property 5: Deterministic draft is built only from confirmed facts

*For any* set of confirmed Facts, the deterministic draft references the substance of each confirmed Fact and is non-empty.

**Validates: Requirements 6.1, 4.4**

### Property 6: Generated content never fabricates laws, case ids, or documents

*For any* confirmed fact set that contains no legal-citation, case-id, or document tokens, all generated content (deterministic draft and any validated LLM output) contains no such tokens that were absent from the inputs.

**Validates: Requirements 6.3, 14.3**

### Property 7: Generated content never states win probability or guaranteed outcome

*For any* confirmed fact set, the generated draft contains no statement of win probability or guaranteed outcome.

**Validates: Requirements 6.4**

### Property 8: Appeal generation falls back to the deterministic template on failure

*For any* confirmed fact set, when the Appeal_Service throws, returns invalid data, or times out, the Draft_Generator returns the deterministic-template draft.

**Validates: Requirements 6.6**

### Property 9: Status transitions are legal and closed over the allowed set

*For any* current Case_Status and *any* attempted target status, the transition succeeds if and only if it is an allowed edge, and every resulting status is one of the six allowed Case_Status values.

**Validates: Requirements 9.4, 7.5, 8.2, 9.5**

### Property 10: Provenance history grows append-only with each tracked change

*For any* sequence of fact and evidence mutations and status changes, the provenance history gains exactly one entry per tracked change and never reorders or removes prior entries.

**Validates: Requirements 8.4**

### Property 11: Question_Engine uses the deterministic Branch_Bank under every fallback trigger

*For any* case, when no LLM credentials are configured, or the Next_Question_Service returns invalid JSON, returns an invented premise, or times out, the Question_Engine returns the deterministic Branch_Bank question, and with no credentials the selection is referentially stable (same case yields the same question).

**Validates: Requirements 13.3, 13.4**

### Property 12: Every Branch_Bank question is fully translated

*For any* Branch_Bank question and *any* of its choices, a translation exists for English, Simplified Chinese, and Spanish.

**Validates: Requirements 11.2**

## Kiro Steering Plan

Real `.kiro/steering/` files committed with the submission:

- **`product.md`** — AppealFlow's purpose, independence framing (independent demo, not a city service, not legal advice, never auto-submits), the five scenarios with payment/breakdown built and three stubbed, and the resident→reviewer→clarification flow.
- **`privacy-and-provenance.md`** — no-PII standard (no plate/ticket number/name/barcode fields anywhere), evidence provenance standard (every Fact carries `source` + `verificationStatus`; every Evidence carries `status`; provenance history is append-only), citation standard (only `official_sources.json`, always with a "verify on official site" note), and the anti-fabrication / no-outcome-claim / no-hardship-scoring rules.
- **`tech.md`** — Next.js App Router + TypeScript + Tailwind; pure logic isolated in `lib/`; `Case_Store` on localStorage + in-memory cache; server-only API keys with deterministic fallback under timeout; Vitest with `--run`; commands (`npm run dev` run manually by the user, `npm run test`, `npm run typecheck`).

## Kiro Hook

One agent hook committed under `.kiro/hooks/`:

- **`lib-change-verify`** — trigger `PostFileSave` with matcher on `lib/**/*.ts`, action `command` running `npm run typecheck && npm run test -- --run`. Keeps the pure-logic layer type-safe and green after every change to `lib/`, which is exactly where Req 14/15 guarantees live.

## Directory / File Structure

```
AppealFlow_Kiro_Launch_Kit/
├─ app/
│  ├─ layout.tsx                 # root layout, Tailwind, Lang context provider
│  ├─ page.tsx                   # landing: nav + independence notice + LanguageSwitcher (Req 1)
│  ├─ resident/
│  │  └─ page.tsx                # ResidentWizard host (Req 2–6, 8, 9)
│  ├─ reviewer/
│  │  └─ page.tsx                # ReviewerDashboard host (Req 7–9)
│  └─ api/
│     ├─ next-question/route.ts  # Next_Question_Service (Req 13)
│     └─ appeal/route.ts         # Appeal_Service (Req 6.2, 6.6)
├─ components/
│  ├─ ResidentWizard.tsx         # scenario select → questions → facts → evidence → draft
│  ├─ ReviewerDashboard.tsx      # neutral structured view + clarification
│  ├─ CaseTimeline.tsx           # provenance history (shared)
│  └─ LanguageSwitcher.tsx       # en/zh/es (Req 1.3, 11)
├─ lib/
│  ├─ questions.ts               # Branch_Bank + Question_Engine (Req 3, 13)
│  ├─ case.ts                    # Case model, Case_Store, status machine (Req 2,4,5,8,9)
│  ├─ templates.ts               # deterministic Draft_Generator (Req 6)
│  ├─ translations.ts            # EN/zh-CN/es strings (Req 11)
│  └─ rules.ts                   # official sources + fairness guards (Req 14)
├─ lib/__tests__/
│  ├─ questions.test.ts          # Property 1,2,11 + 15.2,15.6
│  ├─ case.test.ts               # Property 3,4,9,10 + 15.3,15.4
│  └─ templates.test.ts          # Property 5,6,7,8 + 15.5
├─ data/
│  ├─ demo_cases.json            # existing
│  └─ official_sources.json      # existing
├─ .kiro/
│  ├─ steering/
│  │  ├─ product.md
│  │  ├─ privacy-and-provenance.md
│  │  └─ tech.md
│  ├─ hooks/
│  │  └─ lib-change-verify.json
│  └─ specs/appealflow-mvp/
│     ├─ requirements.md
│     └─ design.md
├─ package.json                  # next, react, typescript, tailwind, vitest, fast-check
├─ tsconfig.json
├─ tailwind.config.ts
└─ vitest.config.ts
```
