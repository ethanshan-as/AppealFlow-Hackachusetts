/**
 * Deterministic appeal-draft generator (Req 6).
 *
 * The draft is assembled ONLY from fields already present on the case:
 * city, violationType, ticketDate, confirmed selectedFacts, and evidence.
 * It never introduces a law, statute, code, case id, date, or document that is
 * not already in those inputs, and never states a win probability or
 * guaranteed outcome. Output is always English (Req 6.1).
 */

import { AppealCase, Evidence, Fact } from "./case";
import { assertSafeGeneratedContent } from "./rules";
import { needsTranslationToEnglish } from "./language";

const SUBMISSION_NOTE =
  "I understand that this appeal must be submitted separately through the official City of Boston parking ticket appeal process, and that this letter does not itself file or decide the appeal.";

/** Placeholder inserted for a confirmed claim that is not yet in English. */
export const TRANSLATION_PLACEHOLDER =
  "[Translation needed — the resident wrote this in their own language. Translate before submitting.]";

const TRANSLATION_WARNING =
  "NOTE: One or more statements below are in the resident's own language and were NOT auto-translated. Please translate the marked lines before submitting; do not submit untranslated text.";

function evidenceLine(ev: Evidence): string {
  // An unattached demo/missing receipt must NEVER read as available or
  // verified supporting documentation (P0 #2). Only "uploaded" is available.
  const statusText =
    ev.status === "uploaded"
      ? "attached and available"
      : ev.status === "simulated"
        ? "a demo example only — not an actual attached document"
        : "not yet available — still needs to be provided";
  const notes = ev.notes ? ` (${ev.notes})` : "";
  return `- ${ev.label}${notes}: ${statusText}`;
}

function factLine(f: Fact): string {
  // Facts are first-person claims until independently verified; keep that
  // framing explicit so nothing reads as an established fact. If the claim is
  // not in English, insert a clear translation-needed marker rather than
  // silently embedding untranslated text (P0 #3).
  const text = f.text.trim().replace(/\s+/g, " ");
  if (needsTranslationToEnglish(text)) {
    return `- ${TRANSLATION_PLACEHOLDER}`;
  }
  const withPeriod = /[.!?]$/.test(text) ? text : `${text}.`;
  return `- ${withPeriod}`;
}

/** The text that is permitted to appear in generated content for this case. */
export function allowedTextFor(c: AppealCase): string {
  return [
    c.city,
    c.violationType,
    c.ticketDate,
    c.statement,
    ...c.selectedFacts.map((f) => f.text),
    ...c.evidence.map((e) => `${e.kind} ${e.label} ${e.notes ?? ""}`),
    c.clarificationResponse?.text ?? "",
  ].join(" ");
}

/**
 * Build the English appeal draft from confirmed facts. `facts` defaults to the
 * case's selectedFacts; the caller passes a filtered set when the resident has
 * excluded unconfirmed facts (Req 4.4).
 */
export function generateDraft(
  c: AppealCase,
  facts: Fact[] = c.selectedFacts
): string {
  const dateClause = c.ticketDate ? ` dated ${c.ticketDate}` : "";
  const header = `To the Parking Clerk,`;

  const intro =
    `I am writing to respectfully appeal a ${c.city} parking citation` +
    `${dateClause} regarding: ${c.violationType}.`;

  const claimsIntro =
    facts.length > 0
      ? "I would like to explain the following, which I am stating to the best of my knowledge:"
      : "I would like to request a review of this citation.";

  const claimsBlock =
    facts.length > 0 ? facts.map(factLine).join("\n") : "";

  const hasUntranslated = facts.some((f) => needsTranslationToEnglish(f.text));
  const translationWarning = hasUntranslated ? TRANSLATION_WARNING : "";

  const evidenceIntro =
    c.evidence.length > 0 ? "Regarding supporting documentation:" : "";
  const evidenceBlock =
    c.evidence.length > 0 ? c.evidence.map(evidenceLine).join("\n") : "";

  const clarificationBlock = c.clarificationResponse?.text
    ? `In response to the request for clarification, I can add: ${c.clarificationResponse.text.trim()}`
    : "";

  const closing =
    "I would be grateful if you would review this explanation and the information above. " +
    "I am happy to provide any further documentation that may help. Thank you for your time and consideration.";

  const signoff = "Respectfully,\n[Your name]";

  const draft = [
    header,
    "",
    translationWarning,
    translationWarning ? "" : null,
    intro,
    "",
    claimsIntro,
    claimsBlock,
    "",
    evidenceIntro,
    evidenceBlock,
    "",
    clarificationBlock,
    "",
    SUBMISSION_NOTE,
    "",
    closing,
    "",
    signoff,
  ]
    .filter((line): line is string => line !== null)
    .filter((line, i, arr) => {
      // Collapse the blank line immediately following an empty section.
      if (line === "" && arr[i - 1] === "") return false;
      return true;
    })
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Defensive: the template is designed never to emit fabricated or outcome
  // content, but we assert it so a future edit can't silently regress.
  assertSafeGeneratedContent(draft, allowedTextFor(c));

  return draft;
}
