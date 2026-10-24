# AppealFlow — Submission Quick Reference

Independent demo. Not a City of Boston service, not legal advice. Never files or
decides an appeal. No win-probability, no fairness score, no PII collected.

## Run locally (no API key needed)

```bash
npm install
npm run test        # 37 tests pass
npm run typecheck   # clean
npm run dev         # currently serving at http://localhost:3001
```

Open the printed URL. Use the **Resident** and **Reviewer (Demo)** tabs.
Language selector: English / 简体中文 / Español. Mode toggle: Simple (default) /
Advanced.

## What this sprint added / fixed

- **Complete trilingual UI** (EN / zh / es) including Simple Mode, insights, and
  warnings.
- **Evidence verification fix (P0):** an unattached demo/simulated or missing
  receipt never counts as uploaded or verified. `lib/caseInsights.ts` is the
  single source of truth; the draft now describes a simulated receipt as "a demo
  example only — not an actual attached document." Regression tests in
  `lib/insights.test.ts`.
- **Untranslated-text fix (P0):** non-English claims never appear verbatim in an
  English letter. With a configured LLM the server translates; otherwise the
  letter inserts a clear "[Translation needed]" marker plus a warning banner.
  `lib/language.ts` + regression tests.
- **HEIC / unsupported images (P0):** `lib/media.ts` returns a friendly
  "can't preview here, file stays on your device" notice instead of a broken
  image.
- **Simple Mode (P1), default on:** one question per screen, large buttons,
  18px+ text, progress bar, Back/Next, voice input with text fallback. Advanced
  Mode and the Reviewer Dashboard are preserved.
- **Case intelligence (P2):** claim / evidence / verified / missing counts and a
  Claim → Evidence → Official-rule trace, all from real case data with traceable
  `data/official_sources.json` links. No external datasets, no fabricated stats.

## Verify the core loop

Resident (pick DEMO-001) → answer questions → review claims → generate draft →
open Reviewer tab, select case → Request clarification → back to Resident, reply
→ Reviewer sees the response and updated status. State is shared via
localStorage across tabs.

## Ship to GitHub

```bash
# repo already initialized and committed locally
git branch -M main
git remote add origin https://github.com/<you>/appealflow.git
git push -u origin main
```

`.kiro/` is committed (specs, 3 steering files, 1 hook). `.env*` is gitignored
(only `.env.example` is tracked). No secrets or PII in the repo.

## Deploy to Vercel

- Import the GitHub repo at vercel.com. Framework auto-detects Next.js
  (`vercel.json` pins it). No environment variables are required for the demo.
- Optional LLM: add `OPENAI_API_KEY` and `OPENAI_MODEL` as Vercel environment
  variables (server-side only). The app works identically without them.

## Kiro usage

Spec-driven build in `.kiro/specs/appealflow-mvp/` (requirements → design →
tasks), steering in `.kiro/steering/`, and a `PostFileSave` hook
(`lib-change-verify`) that runs typecheck + tests on `lib/**/*.ts` changes.
