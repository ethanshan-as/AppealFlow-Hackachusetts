# AppealFlow — Demo & Submission

## Two-minute video (English script)

0:00–0:15 — "Millions of residents get parking tickets, but many don't know how to explain the situation, especially when English isn't their first language. AppealFlow makes every story easier to understand—without claiming to replace the city or a human reviewer."

0:15–0:35 — Switch interface to Español. Open fictional payment dispute. Read aloud a choice question or show the microphone. Answer: "I already paid". Follow-up questions ask for time, payment channel, and receipt. Switch to Chinese briefly to show localization.

0:35–0:55 — Open Facts & Evidence. Distinguish claims from documentation, clearly show missing receipt. Press Generate Appeal. Show editable English draft with no invented claims.

0:55–1:20 — Switch Reviewer (Demo). Explain this is not a city system. Show structured case: claims, evidence, missing information, reference source link, original-language notes. Click Request Clarification: "Can you provide the payment timestamp?"

1:20–1:40 — Switch Resident: see clarification in selected language, type reply, switch Reviewer, see the response and updated evidence status. Emphasize bidirectional comprehension.

1:40–2:00 — Show Kiro's actual specs / steering / hook and actual passing tests or GitHub `.kiro` folder. "AI organizes the conversation, but never fabricates evidence or makes the legal decision."

## Live demo constraints

- Every sample is clearly labeled FICTIONAL / DEMO.
- Do not imply a government integration, appeal filing or favorable outcome.
- Do not show the founder's actual ticket number, license plate, barcode, name or other identifiers.
- Manual text fallback available if microphone/browser capabilities are unavailable.

## Submission checklist

- [ ] App runs without external LLM API key; full end-to-end demo passes.
- [ ] EN/中文/Español UI and microphone/text fallback verified.
- [ ] Reviewer view, clarification loop and evidence provenance implemented.
- [ ] Public GitHub with README, source, tests, actual `.kiro/` docs (generated/used by Kiro).
- [ ] `.env.local` not committed; no genuine ticket data or personal information committed.
- [ ] Public under-3-minute functioning-product demo video, with valid publicly accessible URL.
- [ ] Description in English, Civic Action track, accurate Kiro usage narrative.
- [ ] SundAI entry saved AND confirmation displayed before 8 PM EDT, October 24, 2026.

## Kiro usage narrative (actual usage)

We used Kiro IDE to: build the complete Resident → Appeal Draft → Reviewer →
Clarification vertical slice — a Next.js + TypeScript + Tailwind app with a
deterministic guided question flow (payment & breakdown branch banks), editable
provenance‑tagged facts, evidence metadata, a deterministic English draft
generator, a simulated reviewer dashboard, a two‑way clarification loop over a
shared `Case_Store`, trilingual EN/中文/Español UI, optional voice I/O, and
optional server‑only LLM routes with deterministic fallback.

Spec‑driven development: the real spec is in `.kiro/specs/appealflow-mvp/`
(`requirements.md` — 15 EARS requirements; `design.md` — architecture + 12
correctness properties; `tasks.md` — the implementation plan). One concrete
design decision: sharing case state via `localStorage` + `storage`/focus events
instead of a database, which is what lets the Resident and Reviewer views run
the clarification loop with no backend.

Steering: `.kiro/steering/privacy-and-provenance.md` enforces no‑PII, append‑only
provenance, citations only from `data/official_sources.json`, and the
no‑fabrication / no‑outcome / no‑hardship‑scoring rules — all implemented in
`lib/rules.ts` and asserted by the draft generator.

Hook: `.kiro/hooks/lib-change-verify.json` — a `PostFileSave` hook matching
`lib/**/*.ts` that runs `npm run typecheck && npm run test`, keeping the pure
logic layer green after every edit.

Tests: `npm run test` (Vitest + fast‑check) → **22 tests passing** across
`lib/questions.test.ts`, `lib/case.test.ts`, `lib/templates.test.ts`. Production
build (`npm run build`) compiles successfully; the dev server serves `/`,
`/resident`, and `/reviewer` (HTTP 200) and the `/api/appeal` route returns a
clean deterministic draft with no API key configured.

MCP/powers: not used.

