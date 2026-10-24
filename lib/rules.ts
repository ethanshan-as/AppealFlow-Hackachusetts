/**
 * Fairness and source guards (Req 14).
 *
 * - Official sources come ONLY from data/official_sources.json, each carrying a
 *   "verify on official site" note (Req 14.1, 14.2).
 * - Generated content (deterministic draft and any validated LLM output) must
 *   not fabricate laws, statute/ordinance codes, or case ids that were not in
 *   the inputs (Req 6.3, 14.3).
 * - Generated content must not state a win probability or guaranteed outcome
 *   (Req 6.4).
 *
 * These are pure functions with no I/O beyond importing the static JSON, so
 * they run identically on the server and in tests.
 */

import officialSourcesData from "@/data/official_sources.json";

export interface OfficialSource {
  id: string;
  title: string;
  url: string;
  purpose: string;
  verificationNote: string;
}

export function officialSources(): OfficialSource[] {
  return officialSourcesData as OfficialSource[];
}

/**
 * Patterns that look like fabricated legal citations or case identifiers.
 * We intentionally keep these conservative: the deterministic template never
 * emits them, and any LLM output containing them (not already present in the
 * allowed inputs) is rejected and falls back to the deterministic draft.
 */
const LEGAL_CITATION_PATTERNS: RegExp[] = [
  /\bM\.?G\.?L\.?\b/i, // Massachusetts General Laws
  /\bc\.\s*\d+/i, // "c. 90"
  /§\s*\d+/, // section symbol
  /\bsection\s+\d+/i,
  /\bstatute\s+\d+/i,
  /\bordinance\s+(?:no\.?\s*)?\d+/i,
  /\bchapter\s+\d+/i,
  /\bCMR\b/, // Code of Massachusetts Regulations
  /\b\d{3}\s*CMR\b/i,
];

const CASE_ID_PATTERNS: RegExp[] = [
  /\bcase\s*(?:no\.?|#|id)\s*[:#]?\s*\w+/i,
  /\bdocket\s*(?:no\.?|#)?\s*[:#]?\s*\w+/i,
  /\bcitation\s*(?:no\.?|#)\s*[:#]?\s*\w+/i,
  /\bticket\s*(?:no\.?|#)\s*[:#]?\s*\w+/i,
];

const OUTCOME_CLAIM_PATTERNS: RegExp[] = [
  /\bguarantee(?:d|s)?\b/i,
  /\bwill\s+(?:win|succeed|be\s+(?:approved|dismissed|granted|accepted))\b/i,
  /\bcertain(?:ly)?\s+to\s+(?:win|succeed|be\s+dismissed)\b/i,
  /\b\d{1,3}\s*%\s*(?:chance|likely|likelihood|success)\b/i,
  /\b(?:high|good|strong)\s+(?:chance|likelihood|odds)\s+of\s+(?:winning|success|approval|dismissal)\b/i,
  /\byou\s+will\s+(?:definitely|surely)\b/i,
  /\bprobability\s+of\s+(?:winning|success|approval)\b/i,
];

function normalizeForMatch(s: string): string {
  return s.toLowerCase();
}

/**
 * Throws if `text` contains a legal-citation or case-id token that is not
 * present in `allowedText` (the concatenation of confirmed facts/case fields).
 * Used to reject fabricated premises from LLM output (Req 6.3, 14.3).
 */
export function assertNoFabrication(text: string, allowedText: string): void {
  const allowed = normalizeForMatch(allowedText);

  for (const pattern of [...LEGAL_CITATION_PATTERNS, ...CASE_ID_PATTERNS]) {
    const match = text.match(pattern);
    if (match) {
      const token = normalizeForMatch(match[0]);
      // Allowed only if the exact token already appears in the inputs.
      if (!allowed.includes(token)) {
        throw new Error(
          `Fabricated legal/case reference detected: "${match[0]}"`
        );
      }
    }
  }
}

/** Returns true when the text is free of fabricated references. */
export function isFreeOfFabrication(text: string, allowedText: string): boolean {
  try {
    assertNoFabrication(text, allowedText);
    return true;
  } catch {
    return false;
  }
}

/**
 * Throws if `text` states a win probability or guaranteed outcome (Req 6.4).
 */
export function assertNoOutcomeClaims(text: string): void {
  for (const pattern of OUTCOME_CLAIM_PATTERNS) {
    const match = text.match(pattern);
    if (match) {
      throw new Error(`Outcome/probability claim detected: "${match[0]}"`);
    }
  }
}

export function isFreeOfOutcomeClaims(text: string): boolean {
  try {
    assertNoOutcomeClaims(text);
    return true;
  } catch {
    return false;
  }
}

/**
 * Convenience guard used by the draft generator and API routes: validates
 * both constraints at once.
 */
export function assertSafeGeneratedContent(
  text: string,
  allowedText: string
): void {
  assertNoFabrication(text, allowedText);
  assertNoOutcomeClaims(text);
}
