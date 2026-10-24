/**
 * Case intelligence derived ONLY from actual case data (Req: P2 #8, #10).
 *
 * No external datasets, no fabricated statistics. Every number here is a
 * straight count of what is actually in the AppealCase.
 *
 * Also the single source of truth for evidence verification (P0 #2): an
 * unattached demo receipt (status "simulated" or "missing") must NEVER count
 * as uploaded or verified. Only evidence a resident actually attached
 * (status "uploaded") is treated as verified supporting documentation.
 */

import { AppealCase, Evidence } from "./case";

/** Only truly attached evidence counts as verified (P0 #2). */
export function isEvidenceVerified(e: Evidence): boolean {
  return e.status === "uploaded";
}

/** Simulated/demo or missing evidence is explicitly NOT verified. */
export function isEvidenceUnverified(e: Evidence): boolean {
  return e.status !== "uploaded";
}

export interface CaseCounts {
  claims: number;
  evidenceTotal: number;
  evidenceVerified: number; // status === "uploaded" only
  evidenceSimulated: number;
  evidenceMissing: number;
  missingInformation: number;
  /** Claims that currently have no verified (uploaded) supporting evidence. */
  unsupportedClaims: number;
}

export function caseCounts(c: AppealCase): CaseCounts {
  const evidenceVerified = c.evidence.filter(isEvidenceVerified).length;
  const evidenceSimulated = c.evidence.filter((e) => e.status === "simulated").length;
  const evidenceMissing = c.evidence.filter((e) => e.status === "missing").length;

  // Missing information = evidence items not actually attached + an unanswered
  // guided flow + the absence of any claims. All derived from real case data.
  let missing = evidenceSimulated + evidenceMissing;
  if (c.selectedFacts.length === 0) missing += 1;

  // A claim is "supported" only if there is at least one verified (uploaded)
  // piece of evidence. With no uploaded evidence, every claim is unsupported.
  const unsupportedClaims = evidenceVerified > 0 ? 0 : c.selectedFacts.length;

  return {
    claims: c.selectedFacts.length,
    evidenceTotal: c.evidence.length,
    evidenceVerified,
    evidenceSimulated,
    evidenceMissing,
    missingInformation: missing,
    unsupportedClaims,
  };
}
