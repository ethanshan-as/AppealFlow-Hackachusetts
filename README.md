# AppealFlow

**Every ticket has a story. Every voice deserves to be heard.**

AppealFlow is an accessible, trilingual (English / 简体中文 / Español) web app
that helps a resident explain a parking‑ticket dispute through simple guided
choices (and optional voice) instead of needing to know how to prompt an AI. A
connected **simulated** reviewer view lets a clerk or hearing officer see the
resident's claims, evidence, missing information, and disclosed circumstances,
and a **two‑way clarification loop** connects the two roles.

> **Independent demo — not a City of Boston service, not legal advice.**
> AppealFlow never files or decides an appeal. Submission happens separately at
> the official City of Boston parking‑ticket appeal portal. No outcome is
> predicted; there is no win‑probability and no fairness score.

Built for **Hackachusetts 2026 — Civic Action / Simplified Public Services**.

## Launch commands

```bash
# 1. Install dependencies
npm install

# 2. Run the full test suite (deterministic logic + fairness guards)
npm run test

# 3. Type-check
npm run typecheck

# 4. Start the dev server, then open the URL it prints
npm run dev
# → http://localhost:3000

# Production build (optional)
npm run build && npm run start
```

No API key is required for the full demo. Open **http://localhost:3000** and use
the **Resident** and **Reviewer (Demo)** tabs.

## Demo walkthrough (no key needed)

1. Landing page: pick a language (EN / 中文 / Español) and open **Resident**.
2. Start from a fictional demo case (DEMO‑001 payment dispute, or DEMO‑002
   vehicle breakdown) or write a short fictional description.
3. Answer 2–4 guided questions, one at a time. Each answer becomes an editable
   claim labeled with its source and verification status.
4. Add evidence metadata (type, label, notes, status) — optional local image
   preview stays on your device.
5. Click **Generate appeal draft** for a truthful English letter built only
   from your confirmed facts. Copy it or download it as a `.txt`.
6. Open **Reviewer (Demo)** in another tab, select the case, and see the neutral
   structured view: claims, evidence (listed separately), missing information,
   cited official sources (each with a "verify on official site" note),
   original‑language note, and what remains uncertain.
7. Click **Request clarification** and ask one question.
8. Back in **Resident**, the clarification appears — type a reply. The Reviewer
   tab updates, and both sides share a provenance history.

## Demo cases

Both cases in `data/demo_cases.json` are clearly fictional and marked
`isSynthetic: true`:

- **DEMO‑001** — parking meter payment dispute (Spanish), evidence: payment
  receipt (missing).
- **DEMO‑002** — vehicle breakdown (Chinese), evidence: tow receipt (missing).

No real ticket data, names, plate numbers, or barcodes are ever collected or
committed.

## Technical decisions

- **Next.js (App Router) + TypeScript + Tailwind**, one project with client and
  server routes. No database and no auth in the MVP.
- **Shared state in one browser** via a `Case_Store` built on `localStorage` +
  an in‑memory cache, synchronized across the Resident and Reviewer routes with
  `storage` and focus/visibility events. The clarification loop needs no server.
- **Pure logic isolated in `lib/`** (no React, no network) so it is
  unit‑testable:
  - `case.ts` — models, `Case_Store`, status state machine, pure mutators.
  - `questions.ts` — deterministic Branch_Bank + `nextQuestion`.
  - `rules.ts` — official sources + anti‑fabrication / no‑outcome guards.
  - `templates.ts` — deterministic draft generator.
  - `translations.ts` — EN / zh / es strings.
- **Optional, server‑only LLM**: `app/api/next-question` and `app/api/appeal`
  call a model **only** when `OPENAI_API_KEY` + `OPENAI_MODEL` are set, send only
  confirmed redacted context, validate the result with `zod` + the fairness
  guards, enforce an `AbortController` timeout, and **always fall back** to the
  deterministic path. The key is read from `process.env` only and never reaches
  the browser. Copy `.env.example` → `.env.local` (gitignored) to enable it.
- **Deterministic status machine** with six statuses
  (`draft`, `ready`, `clarification_requested`, `responded`,
  `submission_unverified`, `simulated_outcome`). There is no "submitted" state;
  `simulated_outcome` is a demo‑only result that requires an explicit human
  click.

## Tests

`npm run test` runs Vitest with `fast-check` property tests over `lib/`.
**22 tests pass** across 3 files, covering the 12 correctness properties from
the design, including: the payment/breakdown branch flow (2–4 sequential,
neutral, unselected questions), fact provenance (`source` +
`verificationStatus`), the status‑transition rules, no fabricated laws/case‑ids,
no win‑probability language, the deterministic fallback, and full trilingual
coverage of every branch question.

## Limitations

- OCR of ticket images is not implemented (stretch goal). Image selection only
  shows a local client‑side preview.
- Voice input/output uses the browser's `SpeechRecognition` / `speechSynthesis`
  where available, with a text/choice fallback everywhere; browser vendor
  services may process audio, so it is not claimed to be fully offline/private.
- Three scenarios (`unclear_sign`, `extraordinary_circumstances`, `other`) are
  informational **stubs** that route to free‑text + evidence + draft; the
  `payment` and `breakdown` scenarios are fully guided.
- This is a demo. It does not integrate with any city system and does not submit
  or decide appeals.

## How Kiro was used (honest narrative)

- **Spec‑driven development.** The real spec lives in
  `.kiro/specs/appealflow-mvp/` (`requirements.md`, `design.md`, `tasks.md`).
  Requirements use EARS acceptance criteria; the design fixes the `Case_Store`
  cross‑route sync, the concrete branch banks, the status machine, and 12
  correctness properties. One concrete design decision driven by the spec:
  sharing case state through `localStorage` + `storage` events (not a database),
  which is what makes the two‑way clarification loop work with no backend.
- **Steering.** `.kiro/steering/product.md`, `privacy-and-provenance.md`, and
  `tech.md` enforce the independence framing, the no‑PII and provenance
  standards, citations‑only‑from‑`official_sources.json`, and the
  no‑fabrication / no‑outcome / no‑hardship‑scoring rules that are implemented
  in `lib/rules.ts`.
- **Hook.** `.kiro/hooks/lib-change-verify.json` is a `PostFileSave` hook
  matching `lib/**/*.ts` that runs `npm run typecheck && npm run test`, keeping
  the pure‑logic layer (where the fairness/test guarantees live) type‑safe and
  green.
- **Tests.** `npm run test` → 22 passing tests via Vitest + fast‑check.

## Sources & acknowledgements

Citation links live in `data/official_sources.json` and point to official
Boston.gov parking‑clerk pages. Always verify current wording, deadlines, and
codes on the official site — AppealFlow does not assert legal rules.

## License

Provided for the hackathon demonstration. No warranty. Not affiliated with the
City of Boston.
