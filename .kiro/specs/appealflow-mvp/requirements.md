# Requirements Document

## Introduction

AppealFlow is an accessible, trilingual (English, Simplified Chinese, Spanish) web application that helps a resident explain a parking ticket dispute through guided multiple-choice questions and optional voice input, without needing to know how to prompt an AI. A connected simulated Reviewer view lets a parking clerk or hearing officer examine the resident's factual claims, supporting evidence, missing information, and disclosed circumstances. A two-way clarification loop connects the two roles.

The product is an independent demo. It is not affiliated with the City of Boston, is not a legal advisor, never submits appeals automatically, and never collects personally identifying information. The MVP runs fully without any paid API key using deterministic logic, with optional server-side LLM features that activate only when credentials are supplied.

This document prioritizes a priority-1 vertical slice: the resident guided flow through confirmed facts, draft generation, reviewer view, clarification, and resident reply, for the fully-built `payment` and `breakdown` scenarios. Trilingual UI, voice input/output, and optional LLM features are captured as later priorities. The remaining three scenarios (unclear sign, extraordinary circumstances, other) are stubbed in the MVP.

## Glossary

- **AppealFlow**: The overall web application comprising the Resident experience, Reviewer Demo experience, and shared case state.
- **Resident_App**: The resident-facing part of AppealFlow that guides a resident through scenario selection, questions, fact review, evidence, draft generation, and clarification responses.
- **Reviewer_App**: The simulated reviewer-facing part of AppealFlow that presents a neutral structured view of a case and allows a simulated clarification request.
- **Case_Store**: The shared state layer backed by localStorage and an in-memory store that holds case data accessible to both Resident_App and Reviewer_App within a single browser.
- **Question_Engine**: The component that selects and presents the next guided question. Uses a deterministic branch-question bank by default; may optionally use an LLM via the Next_Question_Service.
- **Next_Question_Service**: The server-side `/api/next-question` route that optionally uses an LLM to choose the next fact gap and propose a question, returning strict validated JSON.
- **Draft_Generator**: The component that produces an English appeal draft from user-confirmed facts, using a deterministic template by default.
- **Appeal_Service**: The server-side `/api/appeal` route that optionally uses an LLM to produce an appeal draft from user-confirmed structured facts.
- **Fact**: A structured statement derived from a resident answer, carrying `id`, `text`, `source`, and `verificationStatus`.
- **Evidence**: A structured record of supporting material carrying `kind`, `label`, optional `notes`, and `status` of `uploaded`, `simulated`, or `missing`.
- **Scenario**: One of five dispute categories: `payment`, `breakdown`, `unclear_sign`, `extraordinary_circumstances`, `other`.
- **Branch_Bank**: A deterministic, scenario-specific set of 2 to 4 follow-up questions with neutral, non-leading choices.
- **Case_Status**: One of `draft`, `ready`, `clarification_requested`, `responded`, `submission_unverified`, or `simulated_outcome`.
- **Official_Source**: A verifiable reference entry from `data/official_sources.json` with `id`, `title`, `url`, `purpose`, and `verificationNote`.
- **Demo_Case**: A clearly fictional, synthetic case from `data/demo_cases.json`.
- **PII**: Personally identifying information, including license plate number, ticket number, person name, and barcode.

## Requirements

### Requirement 1: Landing and navigation

**User Story:** As a visitor, I want a clear landing page with role navigation and an independence notice, so that I understand what AppealFlow is and can choose a role.

#### Acceptance Criteria

1. THE AppealFlow SHALL display a landing page with navigation to the Resident_App and to the Reviewer_App.
2. THE AppealFlow SHALL display a visible notice stating that AppealFlow is an independent demo and not a city service on the landing page.
3. THE AppealFlow SHALL display a language selector offering English, Simplified Chinese, and Spanish.
4. WHEN a visitor selects the Resident navigation, THE AppealFlow SHALL route to the Resident_App.
5. WHEN a visitor selects the Reviewer navigation, THE AppealFlow SHALL route to the Reviewer_App.

### Requirement 2: Case initiation without PII

**User Story:** As a resident, I want to start from a fictional demo case or a short fictional description, so that I can begin an appeal without sharing real information.

#### Acceptance Criteria

1. THE Resident_App SHALL present the two Demo_Cases from `data/demo_cases.json` as selectable starting points.
2. WHEN a resident selects a Demo_Case, THE Resident_App SHALL load that case into the Case_Store.
3. WHERE a resident chooses manual entry, THE Resident_App SHALL accept a short free-text ticket description.
4. THE Resident_App SHALL exclude input fields for PII including license plate number, ticket number, person name, and barcode.
5. THE AppealFlow SHALL mark each Demo_Case as synthetic in the presented data.

### Requirement 3: Guided branching question flow

**User Story:** As a resident, I want to answer a few guided questions one at a time, so that I can explain my situation without knowing how to prompt an AI.

#### Acceptance Criteria

1. THE Resident_App SHALL present five Scenarios: `payment`, `breakdown`, `unclear_sign`, `extraordinary_circumstances`, and `other`.
2. WHEN a resident selects the `payment` Scenario or the `breakdown` Scenario, THE Question_Engine SHALL present between 2 and 4 follow-up questions from the Branch_Bank, one question at a time.
3. WHEN a resident selects the `unclear_sign` Scenario, the `extraordinary_circumstances` Scenario, or the `other` Scenario, THE Resident_App SHALL present a stub flow that indicates the Scenario is not yet fully implemented in the MVP.
4. THE Question_Engine SHALL present each question with between 2 and 4 neutral answer choices plus an "Other / not sure" choice.
5. THE Question_Engine SHALL exclude answer choices that are preselected before the resident responds.
6. THE Branch_Bank SHALL exclude questions that lead the resident toward a predetermined answer.
7. WHEN a resident submits an answer, THE Resident_App SHALL add a corresponding Fact to the Case_Store with `source` set to `resident_answer` and `verificationStatus` set to `claimed`.

### Requirement 4: Editable fact-review

**User Story:** As a resident, I want to review and edit the facts derived from my answers, so that the appeal reflects only what I confirm.

#### Acceptance Criteria

1. THE Resident_App SHALL display a structured fact-review screen listing each Fact with its `text`, `source`, and `verificationStatus`.
2. WHEN a resident edits the text of a Fact, THE Resident_App SHALL persist the edited text to the Case_Store.
3. WHEN a resident removes a Fact, THE Resident_App SHALL remove that Fact from the Case_Store.
4. THE Resident_App SHALL exclude Facts that the resident has not confirmed from the fact set used for draft generation.

### Requirement 5: Evidence metadata and provenance

**User Story:** As a resident, I want to record evidence details and see where each fact came from, so that reviewers understand what supports my claims.

#### Acceptance Criteria

1. WHEN a resident adds Evidence, THE Resident_App SHALL store a `kind`, a `label`, optional `notes`, and a `status` of `uploaded`, `simulated`, or `missing` in the Case_Store.
2. THE Resident_App SHALL display each Fact with its `source` and `verificationStatus`.
3. WHERE a resident selects a local image for Evidence, THE Resident_App SHALL render a preview on the client without transmitting the image to a server.

### Requirement 6: Appeal draft generation

**User Story:** As a resident, I want to generate a truthful English appeal draft from my confirmed facts, so that I can use it when I submit at the official portal.

#### Acceptance Criteria

1. WHEN a resident selects Generate appeal draft and no LLM credentials are configured, THE Draft_Generator SHALL produce an English draft from the confirmed Facts using a deterministic template.
2. WHERE `OPENAI_API_KEY` and `OPENAI_MODEL` are configured, THE Appeal_Service SHALL produce the draft server-side from only the user-confirmed structured Facts.
3. THE Draft_Generator SHALL exclude events, laws, case statuses, documents, and case IDs that are not present in the confirmed Facts.
4. THE Draft_Generator SHALL exclude any statement of win probability or guaranteed outcome.
5. THE AppealFlow SHALL exclude any LLM API key from browser code, browser network requests, and console logs.
6. IF the Appeal_Service fails or returns invalid data, THEN THE Draft_Generator SHALL produce the draft using the deterministic template.

### Requirement 7: Reviewer Demo neutral view

**User Story:** As a reviewer, I want a neutral structured view of a case, so that I can assess claims, evidence, and gaps without a fairness score.

#### Acceptance Criteria

1. THE Reviewer_App SHALL display the resident's claims, Evidence labeled separately from claims, missing information, and cited Official_Sources for the selected case.
2. WHERE hardship context was voluntarily disclosed, THE Reviewer_App SHALL display the hardship context as information without a numeric score.
3. WHERE an original-language excerpt is available, THE Reviewer_App SHALL display the original-language excerpt.
4. THE Reviewer_App SHALL display a statement of what remains uncertain for the case.
5. WHEN a reviewer issues a simulated Request Clarification, THE Reviewer_App SHALL record one clarification question in the Case_Store and set the Case_Status to `clarification_requested`.

### Requirement 8: Two-way clarification loop

**User Story:** As a resident and as a reviewer, I want clarification requests and responses to flow between both views, so that the case record stays current for both sides.

#### Acceptance Criteria

1. WHILE a case has a Case_Status of `clarification_requested`, THE Resident_App SHALL display the clarification question to the resident.
2. WHEN a resident submits a clarification response, THE Resident_App SHALL store the response in the Case_Store and set the Case_Status to `responded`.
3. WHEN a case Case_Status changes, THE Reviewer_App SHALL display the updated case information.
4. THE AppealFlow SHALL display a provenance history of Fact sources and Evidence status changes to both the Resident_App and the Reviewer_App.

### Requirement 9: Output, submission framing, and statuses

**User Story:** As a resident, I want to copy or download my letter and understand how submission works, so that I submit correctly at the official portal.

#### Acceptance Criteria

1. WHEN a resident selects copy, THE Resident_App SHALL copy the appeal letter text to the clipboard.
2. WHERE a resident selects download, THE Resident_App SHALL provide the appeal letter as a TXT file.
3. THE AppealFlow SHALL display a statement that submission occurs separately at the official Boston city appeal portal.
4. THE AppealFlow SHALL restrict Case_Status values to `draft`, `ready`, `clarification_requested`, `responded`, `submission_unverified`, and `simulated_outcome`.
5. THE AppealFlow SHALL exclude setting any Case_Status to a submitted state unless a verified receipt supports that state.
6. WHEN a reviewer records a demo outcome, THE Reviewer_App SHALL label the outcome as `simulated_outcome` and SHALL require a human click to set it.

### Requirement 10: Accessibility, responsiveness, and operation

**User Story:** As any user, I want an accessible, responsive interface with clear states, so that I can use AppealFlow on any device and understand system status.

#### Acceptance Criteria

1. THE AppealFlow SHALL render a responsive layout across mobile and desktop viewport widths.
2. THE AppealFlow SHALL provide keyboard navigation for all interactive controls.
3. THE AppealFlow SHALL provide text labels for all interactive controls.
4. WHILE an asynchronous operation is in progress, THE AppealFlow SHALL display a loading state.
5. IF an operation fails, THEN THE AppealFlow SHALL display an error state.
6. THE AppealFlow SHALL complete the full resident-to-reviewer demo flow without any API key.

### Requirement 11: Trilingual UI (later priority)

**User Story:** As a non-English-speaking resident, I want the interface and questions in my language, so that I can complete an appeal in English, Simplified Chinese, or Spanish.

#### Acceptance Criteria

1. WHEN a user selects a language, THE Resident_App SHALL present interface text and question text in the selected language of English, Simplified Chinese, or Spanish.
2. THE Question_Engine SHALL provide each Branch_Bank question with translations for English, Simplified Chinese, and Spanish.
3. WHEN a user changes language mid-flow, THE Resident_App SHALL retain the current case state in the Case_Store.

### Requirement 12: Voice input and output (later priority)

**User Story:** As a resident, I want optional voice input and read-aloud, so that I can answer by speaking and hear questions when supported.

#### Acceptance Criteria

1. WHERE the browser supports speech recognition, THE Resident_App SHALL provide a microphone control that produces an editable transcript.
2. THE Resident_App SHALL provide a text entry fallback for every question regardless of speech recognition support.
3. WHERE the browser supports speech synthesis, THE Resident_App SHALL provide a Read Aloud control for English, Simplified Chinese, and Spanish question text.
4. WHEN a resident uses the microphone control, THE Resident_App SHALL request microphone permission before capturing audio.

### Requirement 13: Optional LLM question selection (later priority)

**User Story:** As a resident, I want optionally AI-selected next questions, so that the flow adapts to my situation while staying truthful and non-leading.

#### Acceptance Criteria

1. WHERE LLM credentials are configured, THE Next_Question_Service SHALL select the next question server-side and return strict validated JSON with between 2 and 4 non-leading choices plus an "Other / not sure" choice.
2. THE Next_Question_Service SHALL send only user-confirmed, minimally necessary, redacted structured context to the LLM.
3. IF the Next_Question_Service returns invalid JSON, returns an invented premise, or times out, THEN THE Question_Engine SHALL use the deterministic Branch_Bank.
4. WHERE no LLM credentials are configured, THE Question_Engine SHALL use the deterministic Branch_Bank.

### Requirement 14: Official sources and fairness safeguards

**User Story:** As a user, I want verifiable source links and fairness safeguards, so that AppealFlow does not fabricate legal certainty or treat hardship as a score.

#### Acceptance Criteria

1. THE AppealFlow SHALL present citation links only from the Official_Sources in `data/official_sources.json`.
2. WHERE a rule, deadline, or code has not been independently verified, THE AppealFlow SHALL label the reference with a "verify on official site" indication.
3. THE AppealFlow SHALL exclude fabricated facts, laws, case statuses, documents, and case IDs from all generated content.
4. THE AppealFlow SHALL exclude use of hardship context as a numeric score, an automatic approval reason, or a protected-category proxy.

### Requirement 15: Verification tests

**User Story:** As a maintainer, I want automated tests over core logic, so that scenario branching, provenance, statuses, and fallback stay correct.

#### Acceptance Criteria

1. THE AppealFlow SHALL include at least three passing automated tests.
2. THE AppealFlow SHALL include a test verifying Branch_Bank question flow for the `payment` and `breakdown` Scenarios.
3. THE AppealFlow SHALL include a test verifying that each generated Fact carries a `source` and a `verificationStatus`.
4. THE AppealFlow SHALL include a test verifying allowed Case_Status transitions.
5. THE AppealFlow SHALL include a test verifying that deterministic draft generation produces no fabricated laws or case IDs.
6. THE AppealFlow SHALL include a test verifying that the Question_Engine uses the deterministic Branch_Bank when no LLM credentials are configured.
