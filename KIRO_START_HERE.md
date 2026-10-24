# AppealFlow — Kiro Build Brief (Hackachusetts 2026)

> **COPY THE PROMPT BELOW INTO KIRO IDE.** Open this folder in Kiro first. Ask Kiro to create an actual spec and implement it. The files here are requirements/context, **not** a claim of prior Kiro execution. Kiro should create the real `.kiro/` folder as it works.

## Mission

Build **AppealFlow — Every Ticket Has a Story. Every Voice Deserves to Be Heard.**
Track: Hackachusetts 2026 **Civic Action / V1 Simplified Public Services**.

An accessible, trilingual (English, Simplified Chinese, Spanish) web app that helps a resident explain a parking ticket dispute through simple choices and optional voice instead of having to know how to prompt AI. A connected **simulated reviewer view** helps parking clerks / hearing officers review the factual claims, supporting evidence, missing information, and circumstances. The product is not affiliated with the City of Boston and does not submit tickets automatically.

## Your role

You are the main engineer implementing this project in Kiro, using **spec-driven development**. Generate your OWN real `.kiro/specs/appealflow-mvp/` requirements, design, and tasks; create meaningful `.kiro/steering/` files; execute implementation tasks and tests. Preserve the actual `.kiro/` files in Git. Prioritize runnable software over elaborate planning. Do not create pretend Kiro logs or claim features were used when they were not.

## Success path (must work completely without paid keys)

1. Landing page with **Resident** and **Reviewer (Demo)** navigation, trilingual EN / 中文 / Español selector, obvious "Independent demo — not a city service" notice.
2. Resident starts from one of two **clearly fictional** local demo cases in `data/demo_cases.json`, or enters a short fictional ticket description manually. Optional image selection can show a local preview, but OCR is a stretch goal. No real ticket information ever ships in public repository or analytics.
3. Resident picks one of five scenarios (vehicle breakdown; unclear sign; payment/permit conflict; extraordinary circumstances; other). Run a guided **branching multiple-choice flow with 2–4 follow-up questions**, one at a time. Each answer appears in a structured, editable fact-review screen. Never preselect facts about a real user. **AI-powered question selection** is the product feature: when a runtime LLM API key is configured, send only user-confirmed, minimally necessary, redacted structured context to a server-side `/api/next-question` endpoint. The LLM may choose the next fact gap and propose a concise question with 2–4 neutral, non-leading choices, plus "Other / not sure". Constrain with JSON schema and validate outputs against scenario rules; reject invented premises. When no API is configured or validation fails, use a deterministic, well-written branch-question bank. Do not ask leading questions to maximize appeal success.
4. Each question has three-language UI translations. Add an optional mic button using browser SpeechRecognition where supported, with clear mic permission and editable transcript; show text entry fallback where speech recognition is unavailable. Add optional Read Aloud using browser speechSynthesis if supported, for EN/zh-CN/es-ES. Avoid claims of fully offline/private speech recognition; browser vendor services may process audio.
5. The resident can attach evidence metadata (kind, label, notes) and mark evidence as uploaded/simulated/missing. Optional photo preview stays client side in the MVP. Facts carry `source` and `verificationStatus` in the case model.
6. Resident selects **Generate appeal draft**. When `OPENAI_API_KEY` and `OPENAI_MODEL` are supplied, call a server-side route to turn only user-confirmed structured facts into a polite, readable English draft, plus an optional in-language preview. Validate JSON data and forbid invented events/citations. **When no key, use a deterministic, useful template based on the facts.** No AI API key must appear in browser code, browser network calls, git commits, or console logs. No model should predict win probability.
7. Reviewer Demo shows neutral structured view: resident's claims, separately labeled evidence, missing information, cited rules, hardship context (if voluntarily disclosed, **not a fairness score**), original-language excerpt where available, and an explanation of what remains uncertain. Reviewer can issue a **simulated Request Clarification** with one question.
8. Resident sees the clarification and responds. Reviewer sees updated information. Both sides see a status and evidence provenance history. This **two-way loop** is the key differentiator.
9. User can copy appeal letter; optionally download as TXT. The UI must always say submission occurs separately at the **official Boston city appeal portal**; never set status to submitted unless explicitly supported by verified receipt. Default statuses: `draft`, `ready`, `clarification_requested`, `responded`, `submission_unverified`. For demo reviewer outcome, distinctly label `simulated_outcome` and require human click.
10. Fully responsive, professional and accessible interface, visible loading/error states, no API key needed for full demo, and `npm run dev` instructions.

## Strict security, data, and fairness rules

- This product is not a city service or legal advisor. No official city or police integrations. Reviewer interface is a **simulation**, not a government account.
- Do not automatically send letters or appeal decisions. Avoid eligibility conclusions and guaranteed outcomes.
- Generate from user-confirmed statements ONLY. Label first-person claims as claims until independently verified. No fabricated facts, laws, case status, documents, or case IDs.
- The real ticket the founder owns was already resolved; it can inform private UX testing but **must not** be added to code, commits, demos, or third-party AI calls. Public demo cases are fiction. Do not collect personally identifying information such as plate number, ticket number, name or barcode.
- Add citation links to verifiable sources in `data/official_sources.json`. Don't invent detailed legal rules. Check sources before quoting deadlines; otherwise label "verify on official site".
- User hardship is not a score, automatic reason for approval, or a protected-category proxy.
- If a camera or microphone is not supported, clear manual input fallback.
- Accessibility: keyboard navigation, sufficiently contrasting interface, labels for controls, and short simple text in three languages.

## Architecture — minimal

Use **Next.js + TypeScript + Tailwind**, one project containing both client and server route. If initialization becomes a blocker, choose the simplest equivalent full-stack TypeScript architecture but document the choice. UI can use Lucide icons and plain Tailwind; do not spend time on heavy UI dependencies. Local JSON / localStorage for fictional demo cases, no database/auth in MVP. Small backend endpoints `/api/next-question` and `/api/appeal` call the model only if credentials exist. Return strict validated JSON from question endpoint; set timeouts and always fall back to local branches. Isolate pure logic for branches, status transitions, and draft fact extraction.

Suggested source structure:
- `app/page.tsx` or equivalent: responsive entry and both roles
- `components/ResidentWizard`, `components/ReviewerDashboard`, `components/CaseTimeline`, `components/LanguageSwitcher`
- `lib/questions.ts`, `lib/case.ts`, `lib/templates.ts`, `lib/translations.ts`, `lib/rules.ts`
- `app/api/appeal/route.ts` and `app/api/next-question/route.ts` with server-side optional API provider
- `data/demo_cases.json`, `data/official_sources.json` (already supplied)
- tests verifying scenario branches, facts provenance, state transitions, no fabricated legal certainty, and deterministic fallback

## Kiro workflow for judging

- Use a real Kiro **Spec** to implement this feature: requirements -> design -> tasks -> implementation.
- Use **Steering** for product goals, privacy and evidence provenance standards.
- Add one actual **Hook** that runs lightweight tests/typecheck after relevant changes if feasible; note what triggers it.
- Document which Kiro features you actually used, with concrete examples. No invented MCP usage.
- Commit Kiro's actual `.kiro/` directory to public GitHub, never ignore it. `.env.local` must be gitignored.
- Produce `README.md` with start instructions, demo cases, technical decisions, limitations, license/source acknowledgements and honest Kiro usage.
- For submission: a working web URL if possible, a public GitHub repo and an actual demo video **under 3 minutes** linked publicly from YouTube/Vimeo/Facebook/Youku; confirm SundAI project submission before the deadline. The video can demonstrate local app if live hosting isn't available.

## Time-critical order

**Build the resident choices -> facts review -> draft -> reviewer -> clarification -> resident reply end-to-end first.** Then trilingual text, then voice input/read aloud, then optional LLM API. Image OCR is stretch only; don't lose the submission to a hard integration.

## Definition of done

- Run app without API key using two fictional sample cases.
- Language can be switched EN, 简体中文, Español throughout resident path. When an API key exists, the next multiple-choice question can be dynamically selected/generated by LLM under structured constraints; without the key, deterministic branches work.
- 2–4 guided questions depend on selected scenario.
- Generate truthful English appeal draft from confirmed facts.
- Reviewer independently sees claims/evidence gaps and sends clarification; resident responds.
- At least three passing tests and documented setup.
- Real `.kiro/` created by Kiro and pushed to GitHub.

### FIRST RESPONSE FROM KIRO

Read the files here, create a short, minimal Spec and immediately implement **only the vertical slice**. Do not stop after writing a planning document. Tell me exactly which local commands to run and which route to open. Save extra feature work for after the working vertical slice. Do not ask broad design questions—make sensible defaults.
