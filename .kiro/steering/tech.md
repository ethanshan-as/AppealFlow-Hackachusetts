# Tech standards

## Stack

- Next.js (App Router) + TypeScript + Tailwind, one project with client and
  server routes.
- No database and no auth in the MVP. Case state is shared across the Resident
  and Reviewer routes in a single browser via a `Case_Store` built on
  `localStorage` + an in-memory cache, synchronized with `storage` and
  focus/visibility events.

## Layering

- Pure domain logic lives in `lib/` with **no React and no network I/O**:
  - `lib/case.ts` — models, `Case_Store`, status state machine, pure mutators.
  - `lib/questions.ts` — Branch_Bank + deterministic `nextQuestion`.
  - `lib/rules.ts` — official sources + anti-fabrication / no-outcome guards.
  - `lib/templates.ts` — deterministic draft generator.
  - `lib/translations.ts` — EN / zh / es strings.
- React bits (`useCase`, `LangContext`, components) are thin views over `lib/`.
- The optional LLM lives only in `app/api/next-question` and `app/api/appeal`,
  reads keys from `process.env`, uses an `AbortController` timeout, and always
  falls back to deterministic logic.

## Verification

- Tests: Vitest with `fast-check` property tests over `lib/`. Run with
  `npm run test` (which runs `vitest --run`).
- Types: `npm run typecheck` (`tsc --noEmit`).
- Dev server: `npm run dev` (run manually by the user). Production: `npm run build`.
- Keep `lib/` green and type-safe after every change — that is where the Req 14
  and Req 15 guarantees live.
