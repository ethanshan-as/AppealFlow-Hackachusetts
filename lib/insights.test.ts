/**
 * Regression tests for the P0/P2 fixes:
 *  - Evidence verification: unattached demo receipts never count as verified.
 *  - Translation guard: non-English claims never appear verbatim in the draft.
 *  - Media: HEIC / unsupported images degrade gracefully.
 *  - Case intelligence: counts come only from real case data.
 */

import { describe, it, expect } from "vitest";
import { caseCounts, isEvidenceVerified } from "./caseInsights";
import {
  containsChinese,
  containsSpanishMarkers,
  needsTranslationToEnglish,
  scanFactsForTranslation,
} from "./language";
import { buildPreview, isLikelyUnsupportedImage } from "./media";
import { generateDraft, TRANSLATION_PLACEHOLDER } from "./templates";
import { normalizeCase, AppealCase } from "./case";

function caseWith(
  facts: string[],
  evidence: { label: string; status: string }[]
): AppealCase {
  return normalizeCase({
    caseId: "R-1",
    isSynthetic: true,
    city: "Boston",
    violationType: "Parking meter payment dispute",
    ticketDate: "2026-10-10",
    scenario: "payment",
    residencyLanguage: "en",
    statement: "x",
    selectedFacts: facts.map((text, i) => ({
      id: `f${i}`,
      text,
      source: "resident_answer",
      verificationStatus: "claimed",
    })),
    evidence: evidence.map((e) => ({
      kind: "payment_receipt",
      label: e.label,
      status: e.status,
    })),
    status: "draft",
  });
}

describe("evidence verification (P0 #2 regression)", () => {
  it("a simulated demo receipt is NOT verified", () => {
    expect(isEvidenceVerified({ kind: "x", label: "demo", status: "simulated" })).toBe(false);
  });
  it("a missing receipt is NOT verified", () => {
    expect(isEvidenceVerified({ kind: "x", label: "none", status: "missing" })).toBe(false);
  });
  it("only an uploaded receipt is verified", () => {
    expect(isEvidenceVerified({ kind: "x", label: "real", status: "uploaded" })).toBe(true);
  });

  it("counts never treat simulated/missing evidence as verified", () => {
    const c = caseWith(
      ["I paid at the meter"],
      [
        { label: "Demo receipt", status: "simulated" },
        { label: "Other receipt", status: "missing" },
      ]
    );
    const counts = caseCounts(c);
    expect(counts.evidenceTotal).toBe(2);
    expect(counts.evidenceVerified).toBe(0);
    expect(counts.unsupportedClaims).toBe(1);
    expect(counts.missingInformation).toBeGreaterThanOrEqual(2);
  });

  it("an uploaded receipt supports the claim", () => {
    const c = caseWith(["I paid at the meter"], [{ label: "App record", status: "uploaded" }]);
    const counts = caseCounts(c);
    expect(counts.evidenceVerified).toBe(1);
    expect(counts.unsupportedClaims).toBe(0);
  });

  it("draft describes a simulated receipt as a demo example, not available", () => {
    const c = caseWith(["I paid at the meter"], [{ label: "Demo receipt", status: "simulated" }]);
    const draft = generateDraft(c);
    expect(draft).toContain("demo example");
    expect(draft).not.toMatch(/Demo receipt[^\n]*attached and available/);
  });
});

describe("language / translation guard (P0 #3 regression)", () => {
  it("detects Chinese and Spanish script", () => {
    expect(containsChinese("我已经付款了")).toBe(true);
    expect(containsChinese("I paid")).toBe(false);
    expect(containsSpanishMarkers("Ya pagué el parquímetro")).toBe(true);
    expect(containsSpanishMarkers("I paid")).toBe(false);
    expect(needsTranslationToEnglish("我已经付款了")).toBe(true);
    expect(needsTranslationToEnglish("Mi coche se averió")).toBe(true);
    expect(needsTranslationToEnglish("My car broke down")).toBe(false);
  });

  it("scans a fact list for untranslated entries", () => {
    const scan = scanFactsForTranslation(["I paid", "我已经付款了", "My car broke down"]);
    expect(scan.needsTranslation).toBe(true);
    expect(scan.untranslatedFactIndexes).toEqual([1]);
  });

  it("untranslated Chinese never appears verbatim in the English draft", () => {
    const c = caseWith(["我已经付款了，有收据"], []);
    const draft = generateDraft(c);
    expect(containsChinese(draft)).toBe(false);
    expect(draft).toContain(TRANSLATION_PLACEHOLDER);
    expect(draft).toContain("NOT auto-translated");
  });

  it("untranslated Spanish never appears verbatim in the English draft", () => {
    const c = caseWith(["Ya pagué el parquímetro"], []);
    const draft = generateDraft(c);
    expect(containsSpanishMarkers(draft)).toBe(false);
    expect(draft).toContain(TRANSLATION_PLACEHOLDER);
  });

  it("plain English claims pass through unchanged", () => {
    const c = caseWith(["I paid at the meter"], []);
    const draft = generateDraft(c);
    expect(draft).toContain("I paid at the meter");
    expect(draft).not.toContain(TRANSLATION_PLACEHOLDER);
  });
});

describe("media preview (P0 #4 regression)", () => {
  const fakeUrl = () => "blob:fake";

  it("flags HEIC by mime type", () => {
    expect(isLikelyUnsupportedImage({ type: "image/heic", name: "photo.heic" })).toBe(true);
  });
  it("flags HEIC by extension even with empty mime", () => {
    expect(isLikelyUnsupportedImage({ type: "", name: "IMG_0001.HEIC" })).toBe(true);
  });
  it("returns an unsupported result with a message for HEIC", () => {
    const file = { type: "image/heic", name: "photo.heic" } as File;
    const result = buildPreview(file, fakeUrl);
    expect(result.kind).toBe("unsupported");
    expect(result.url).toBeNull();
    expect(result.message).toBeTruthy();
  });
  it("returns an image result for a JPEG", () => {
    const file = { type: "image/jpeg", name: "photo.jpg" } as File;
    const result = buildPreview(file, fakeUrl);
    expect(result.kind).toBe("image");
    expect(result.url).toBe("blob:fake");
  });
});
