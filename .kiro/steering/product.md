# Product — AppealFlow

AppealFlow helps a resident explain a parking-ticket dispute through simple,
guided choices (and optional voice) instead of needing to know how to prompt an
AI. A connected, **simulated** reviewer view lets a clerk or hearing officer see
the resident's claims, evidence, missing information, and disclosed
circumstances. A two-way clarification loop connects the two roles.

## Framing (always true in every surface)

- AppealFlow is an **independent demo**. It is **not** a City of Boston service,
  **not** a government account, and **not** legal advice.
- AppealFlow **never** files or submits an appeal, and **never** decides one.
  Submission happens separately at the official City of Boston appeal portal.
- No outcome is predicted. There is no "win probability" and no fairness score.

## Scenarios

Five dispute categories exist: `payment`, `breakdown`, `unclear_sign`,
`extraordinary_circumstances`, `other`.

- **Built** (full guided branch bank, 2–4 questions): `payment`, `breakdown`.
- **Stubbed** (informational step + free-text + evidence + draft):
  `unclear_sign`, `extraordinary_circumstances`, `other`.

## Core flow (priority-1 vertical slice)

Resident picks a demo case or writes a short fictional description → answers
guided questions one at a time → reviews/edits the derived claims → optionally
adds evidence → generates a truthful English appeal draft → Reviewer sees a
neutral structured view → Reviewer requests one clarification → Resident replies
→ both sides see the updated status and provenance history. The whole flow runs
with **no API key**.
