# Privacy, Evidence Provenance, and Fairness Standards

These standards are enforced in `lib/` and must hold across every change.

## No PII

- Never add input fields or data-model fields for personally identifying
  information: license plate, ticket number, person name, or barcode.
- The `AppealCase` model intentionally has nowhere to store PII. Keep it that
  way. Demo cases are fictional and marked `isSynthetic: true`.

## Evidence provenance

- Every `Fact` carries a `source` (`resident_answer` | `resident_edit` |
  `demo_seed`) and a `verificationStatus` (`claimed` | `simulated` |
  `unverified`). First-person claims stay labeled as claims until independently
  verified.
- Every `Evidence` carries a `status` (`uploaded` | `simulated` | `missing`).
- The provenance history is **append-only**. Mutators add exactly one entry per
  tracked change and never reorder or remove prior entries.

## Citations

- Citations come **only** from `data/official_sources.json`. Do not invent legal
  rules, deadlines, or codes.
- Every rendered source shows its `verificationNote` as a "verify on the
  official site" indication.

## Anti-fabrication / no-outcome / no-scoring

- Generated content (deterministic draft and any validated LLM output) must not
  fabricate laws, statute/ordinance codes, case ids, or documents. Enforced by
  `rules.assertNoFabrication`.
- Generated content must not state a win probability or guaranteed outcome.
  Enforced by `rules.assertNoOutcomeClaims`.
- Disclosed hardship is **context only** — never a numeric score, an automatic
  approval reason, or a protected-category proxy. There is no hardship score
  field in the model.

## Secrets

- `OPENAI_API_KEY` / `OPENAI_MODEL` are read **only** in server API routes via
  `process.env`. No key appears in client code, client network calls, commits,
  or logs. `.env.local` is gitignored; `.env.example` documents the variables.
