# Implementation Plan: AppealFlow MVP

## Overview

This plan builds the priority-1 vertical slice first so a working demo exists end-to-end as early as possible: Resident selects a scenario → answers guided questions one at a time → reviews and confirms derived facts → generates a deterministic English draft → the Reviewer sees a neutral structured view → the Reviewer requests a clarification → the resident replies. The whole slice runs with no API key.

Tasks are ordered to deliver that runnable slice before any later-priority feature. The `lib/` pure-logic layer (`case.ts`, `questions.ts`, `rules.ts`, `templates.ts`) is built and tested first, then the shared `Case_Store` hook, then the resident and reviewer UIs and routes that wire the slice together. Later-priority work (trilingual UI, voice, optional LLM polish) and submission scaffolding (steering files, hook, README) are marked optional with `*` where they are not required for the working demo.

Convert the feature design into a series of prompts for a code-generation LLM that will implement each step with incremental progress. Make sure that each prompt builds on the previous prompts, and ends with wiring things together. There should be no hanging or orphaned code that isn't integrated into a previous step. Focus ONLY on tasks that involve writing, modifying, or testing code.

## Tasks

- [x] 1. Project scaffold and tooling
  - [x] 1.1 Create the Next.js (App Router) + TypeScript + Tailwind project skeleton
    - Add `package.json` with `next`, `react`, `react-dom`, `typescript`, `tailwindcss`, `postcss`, `autoprefixer`, `vitest`, `fast-check`, and `zod`; add scripts `dev`, `build`, `test` (`vitest --run`), and `typecheck` (`tsc --noEmit`)
    - Add `tsconfig.json`, `tailwind.config.ts`, `postcss.config.js`, and `vitest.config.ts`
    - Create `app/layout.tsx` and a minimal `app/page.tsx` placeholder plus `app/globals.css` with Tailwind directives
    - Ensure `data/demo_cases.json` and `data/official_sources.json` are reachable from app code (import from `/data` or copy into a loadable location)
    - Add `.gitignore` entry for `.env.local`
    - _Requirements: 10.1, 10.6_

- [x] 2. Core domain model, Case_Store, and status machine (lib/case.ts)
  - [x] 2.1 Define core data models and the Case_Store with status state machine
    - In `lib/case.ts` define `Scenario`, `CaseStatus`, `FactSource`, `VerificationStatus`, `Fact`, `EvidenceStatus`, `Evidence`, `ClarificationQuestion`, `ClarificationResponse`, `ProvenanceKind`, `ProvenanceEntry`, and `AppealCase`
    - Implement `CaseStore` (localStorage versioned keys `appealflow:v1:cases` / `appealflow:v1:active` + in-memory cache + subscribe) with `loadAll`, `get`, `save`, `setActive`, `getActive`, `seedFromDemo`, and `subscribe`; normalize raw demo records (default `provenance: []`, `answeredQuestionIds: []`, drop unknown keys)
    - Implement `TRANSITIONS`, `canTransition(from,to)`, and `transition(c,to)` (throws on illegal transition, appends a `status_changed` provenance entry)
    - _Requirements: 2.2, 2.5, 9.4, 9.5, 10.5_
  - [x] 2.2 Implement the useCase hook with provenance-appending mutators
    - Add `useCase(caseId?)` that subscribes to `CaseStore`, `storage`, and `visibilitychange`/`focus`, invalidating the cache and re-reading
    - Provide typed mutators `addFact`, `editFact`, `removeFact`, `addEvidence`, `setEvidenceStatus`, `setStatus`, `requestClarification`, `respondClarification`; each appends exactly one `ProvenanceEntry` then calls `save()`
    - _Requirements: 4.2, 4.3, 5.1, 7.5, 8.2, 8.4_
  - [x] 2.3 Write property/unit tests for the model, store, and status machine
    - **Property 3: Answers produce provenance-tagged facts** — Validates: Requirements 3.7
    - **Property 4: Case_Store round-trip preserves state** — Validates: Requirements 4.2, 4.3, 5.1
    - **Property 9: Status transitions are legal and closed over the allowed set** — Validates: Requirements 9.4, 7.5, 8.2, 9.5
    - **Property 10: Provenance history grows append-only with each tracked change** — Validates: Requirements 8.4
    - Add example tests for demo-case normalization and store round-trip; tag each property test `Feature: appealflow-mvp, Property N: <text>` with ≥100 iterations
    - _Requirements: 15.1, 15.3, 15.4_

- [x] 3. Guided branching Question_Engine (lib/questions.ts)
  - [x] 3.1 Implement the Branch_Bank and deterministic Question_Engine
    - In `lib/questions.ts` define `Choice`, `BranchQuestion`, and `OTHER_CHOICE`; build the concrete `payment` flow (pay_q1→pay_q2/pay_q3) and `breakdown` flow (brk_q1→brk_q2→brk_q3) from the design, and a single `STUB_FLOW` for `unclear_sign`, `extraordinary_circumstances`, and `other`
    - Implement the pure `nextQuestion(c)` (lowest-order reachable unanswered question; `null` when complete) and the answer-submission path that records `answeredQuestionIds` and derives a `Fact` with `source: "resident_answer"`, `verificationStatus: "claimed"`
    - Append `OTHER_CHOICE` at render time so every presented question has 2–4 neutral choices plus "Other / not sure" and nothing is preselected
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7_
  - [x] 3.2 Write property/unit tests for branch flow and determinism
    - **Property 1: Built scenarios present 2–4 sequential questions** — Validates: Requirements 3.2
    - **Property 2: Every presented question is neutral, bounded, and unselected** — Validates: Requirements 3.4, 3.5
    - **Property 11: Question_Engine uses the deterministic Branch_Bank under every fallback trigger (referential stability with no credentials)** — Validates: Requirements 13.3, 13.4
    - Add an example test routing stubbed scenarios to `STUB_FLOW`; tag property tests with ≥100 iterations
    - _Requirements: 15.1, 15.2, 15.6_

- [x] 4. Fairness and source guards (lib/rules.ts)
  - [x] 4.1 Implement official-sources loader and anti-fabrication / no-outcome guards
    - In `lib/rules.ts` add `officialSources()` reading `data/official_sources.json` read-only and exposing each `verificationNote` for "verify on official site" labeling
    - Implement `assertNoFabrication(text, allowedTokens)` (reject legal-citation and case-id patterns absent from `allowedTokens`) and `assertNoOutcomeClaims(text)` (reject win-probability / guaranteed-outcome phrasing)
    - _Requirements: 14.1, 14.2, 14.3, 6.3, 6.4_

- [x] 5. Deterministic draft generation (lib/templates.ts)
  - [x] 5.1 Implement generateDraft from confirmed facts with forbidden-content enforcement
    - In `lib/templates.ts` implement `generateDraft(c)` producing an English draft only from `city`, `violationType`, `ticketDate`, confirmed `selectedFacts`, and `evidence`; no invented law, code, case id, date, or document; no probability/guarantee language
    - Run `rules.assertNoFabrication` / `rules.assertNoOutcomeClaims` on output and strip-and-regenerate from the safe template on any failure
    - _Requirements: 6.1, 6.3, 6.4, 4.4_
  - [x] 5.2 Write property tests for draft safety
    - **Property 5: Deterministic draft is built only from confirmed facts** — Validates: Requirements 6.1, 4.4
    - **Property 6: Generated content never fabricates laws, case ids, or documents** — Validates: Requirements 6.3, 14.3
    - **Property 7: Generated content never states win probability or guaranteed outcome** — Validates: Requirements 6.4
    - Tag each property test with ≥100 iterations
    - _Requirements: 15.1, 15.5_

- [x] 6. Checkpoint - vertical-slice logic is green
  - Ensure all tests pass, ask the user if questions arise.

- [x] 7. Shared UI primitives
  - [x] 7.1 Implement CaseTimeline provenance component
    - Create `components/CaseTimeline.tsx` rendering the append-only `provenance` entries (kind, summary, timestamp) for both roles, with keyboard-navigable, labeled controls and responsive layout
    - _Requirements: 8.4, 10.1, 10.2, 10.3_

- [x] 8. Resident experience (vertical slice)
  - [x] 8.1 Implement ResidentWizard: scenario select, case initiation, and one-at-a-time questions
    - Create `components/ResidentWizard.tsx` presenting the two synthetic Demo_Cases and a short free-text manual-entry path (no PII fields), loading into `Case_Store`
    - Present the five scenarios; drive the guided flow via `nextQuestion`, rendering one question at a time with its neutral choices plus "Other / not sure" (nothing preselected); route stubbed scenarios through `STUB_FLOW`; add each answer as a provenance-tagged Fact
    - Show loading and error states for async operations
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 3.1, 3.2, 3.3, 3.4, 3.5, 3.7, 10.2, 10.3, 10.4, 10.5_
  - [x] 8.2 Implement editable fact review and evidence metadata
    - Add a fact-review screen listing each Fact with `text`, `source`, `verificationStatus`; allow edit (persist) and remove; exclude unconfirmed facts from draft input
    - Add evidence capture storing `kind`, `label`, optional `notes`, and `status` (uploaded/simulated/missing); render a client-only local image preview without transmitting it
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 5.1, 5.2, 5.3_
  - [x] 8.3 Implement draft generation, output, submission framing, and clarification reply
    - Wire Generate appeal draft to the deterministic `generateDraft` (default no-key path); provide Copy to clipboard and Download as TXT; display the "submission occurs separately at the official Boston portal" statement and the independent-demo framing
    - While status is `clarification_requested`, display the reviewer's clarification question; on resident response store it and transition to `responded`
    - _Requirements: 6.1, 9.1, 9.2, 9.3, 8.1, 8.2, 10.4, 10.5_

- [x] 9. Reviewer experience (vertical slice)
  - [x] 9.1 Implement ReviewerDashboard neutral structured view
    - Create `components/ReviewerDashboard.tsx` rendering, for the active case, separate sections for claims (facts with source/verification badges), evidence (labeled distinctly from claims), missing information, cited Official_Sources with "verify on official site" notes, voluntarily disclosed hardship context as plain text with no numeric score, any original-language excerpt, an explicit "what remains uncertain" statement, and the shared `CaseTimeline`
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 14.1, 14.2, 14.4, 8.4_
  - [x] 9.2 Implement simulated clarification request and demo-outcome recording
    - Add Request Clarification (records one `ClarificationQuestion`, transitions to `clarification_requested`); reflect updated case info on status change
    - Add demo-outcome recording that labels the result `simulated_outcome` and requires a human click; never set a submitted state without a verified receipt
    - _Requirements: 7.5, 8.3, 9.4, 9.5, 9.6_

- [x] 10. App routes and wiring
  - [x] 10.1 Build landing page with role nav, independence notice, and language selector
    - Implement `app/page.tsx` with navigation to `/resident` and `/reviewer`, a visible independent-demo notice, and a language selector offering English, Simplified Chinese, and Spanish (selector wired; translations land in task 12)
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  - [x] 10.2 Wire resident and reviewer route pages to the shared Case_Store
    - Implement `app/resident/page.tsx` hosting `ResidentWizard` and `app/reviewer/page.tsx` hosting `ReviewerDashboard`, both reading/writing the same `Case_Store` so clarification requests and responses flow across routes in one browser
    - _Requirements: 1.4, 1.5, 8.1, 8.2, 8.3, 10.1, 10.6_

- [x] 11. Checkpoint - vertical slice runnable end-to-end without a key
  - Ensure all tests pass, ask the user if questions arise.

- [x] 12. Trilingual UI (later priority)
  - [x]* 12.1 Implement translations module and LanguageSwitcher
    - Create `lib/translations.ts` with `Lang`, `Dict`, `translations` (en/zh/es), and `t(lang,key)` falling back to en then key; provide EN/zh/es entries for all UI keys and every Branch_Bank `promptKey`/`labelKey`
    - Create `components/LanguageSwitcher.tsx` updating active `Lang` in context, re-rendering labels only and never mutating `Case_Store`; keep generated draft English
    - _Requirements: 11.1, 11.2, 11.3_
  - [x]* 12.2 Write property test for complete translation coverage
    - **Property 12: Every Branch_Bank question is fully translated** — Validates: Requirements 11.2
    - Tag with ≥100 iterations
    - _Requirements: 15.1_

- [x] 13. Voice input and output (later priority)
  - [x]* 13.1 Implement voice wrappers and controls with fallbacks
    - Feature-detect `SpeechRecognition`/`webkitSpeechRecognition` for a mic control producing an editable transcript and requesting microphone permission before capture; always keep a text/choice fallback for every question
    - Feature-detect `speechSynthesis` for a Read Aloud control using the active `Lang` voice (en/zh-CN/es), hidden when unsupported
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

- [x] 14. Optional server-side LLM augmentation (later priority)
  - [x]* 14.1 Implement /api/next-question with zod validation, timeout, and deterministic fallback
    - Create `app/api/next-question/route.ts` reading `OPENAI_API_KEY`/`OPENAI_MODEL` from `process.env` only; send only confirmed, redacted context; validate strict JSON (zod), append "Other / not sure", cap at 4 base choices; fall back to `{ source: "deterministic" }` on missing credentials, invalid JSON, invented premise (`rules.assertNoFabrication`), or `AbortController` timeout; never expose the key to the browser
    - _Requirements: 13.1, 13.2, 13.3, 13.4, 6.5_
  - [x]* 14.2 Implement /api/appeal with server-side guards and deterministic fallback
    - Create `app/api/appeal/route.ts` producing a draft from only the confirmed inputs when credentials exist, running `assertNoFabrication`/`assertNoOutcomeClaims` server-side, and falling back to `generateDraft` on throw/invalid/timeout/assertion failure; wire the client to call `generateDraft` locally when the response is missing/invalid/`source !== "llm"`
    - _Requirements: 6.2, 6.5, 6.6_
  - [x]* 14.3 Write property test for appeal fallback
    - **Property 8: Appeal generation falls back to the deterministic template on failure** — Validates: Requirements 6.6
    - Tag with ≥100 iterations
    - _Requirements: 15.1, 15.6_

- [x] 15. Kiro steering and hook (submission scaffolding)
  - [x] 15.1 Author steering files and the lib-change verification hook
    - Create `.kiro/steering/product.md`, `.kiro/steering/privacy-and-provenance.md`, and `.kiro/steering/tech.md` per the design's steering plan
    - Create `.kiro/hooks/lib-change-verify.json` as a `PostFileSave` hook matching `lib/**/*.ts` that runs `npm run typecheck && npm run test -- --run`
    - _Requirements: 15.1_

- [x] 16. Final checkpoint - full verification
  - Run `npm run build` and `vitest --run`; ensure the build succeeds and all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional. The required (unmarked) tasks deliver the runnable priority-1 vertical slice end-to-end without any API key. The vertical-slice tests (2.3, 3.2, 5.2) and the steering/hook task (15.1) are required to satisfy Req 15 and the hackathon submission deliverables (at least three passing tests plus a real `.kiro/` directory with steering files and a hook). The remaining optional tasks cover later-priority features (trilingual UI in 12.1/12.2, voice in 13.1, optional LLM polish in 14.1/14.2/14.3).
- Property tests are complementary to unit/example tests; each property test is tagged `Feature: appealflow-mvp, Property N: <text>` and runs ≥100 iterations.
- Each task references specific requirement clauses for traceability. All `lib/` logic is pure and unit-testable in isolation.
- Checkpoints (tasks 6, 11, 16) provide incremental validation points.

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["2.1", "4.1"] },
    { "id": 2, "tasks": ["2.2", "3.1", "5.1"] },
    { "id": 3, "tasks": ["2.3", "3.2", "5.2", "7.1", "9.1", "12.1"] },
    { "id": 4, "tasks": ["8.1", "9.2", "10.1", "12.2", "13.1", "14.1"] },
    { "id": 5, "tasks": ["8.2", "14.2"] },
    { "id": 6, "tasks": ["8.3", "14.3"] },
    { "id": 7, "tasks": ["10.2", "15.1"] }
  ]
}
```
