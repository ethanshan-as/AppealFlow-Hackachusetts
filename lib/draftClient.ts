/**
 * Client-side draft resolver. Tries the optional Appeal_Service, validates the
 * result, and falls back to the guaranteed deterministic template on any
 * failure (Req 6.2, 6.6). The deterministic path is always available with no
 * API key, so the demo works identically with or without credentials.
 */

import { AppealCase } from "./case";
import { generateDraft, allowedTextFor } from "./templates";
import { assertNoFabrication, assertNoOutcomeClaims } from "./rules";
import { needsTranslationToEnglish } from "./language";

const CLIENT_TIMEOUT_MS = 9000;

export async function resolveDraft(c: AppealCase): Promise<string> {
  const deterministic = generateDraft(c);
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);
    const res = await fetch("/api/appeal", {
      method: "POST",
      signal: controller.signal,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        city: c.city,
        violationType: c.violationType,
        ticketDate: c.ticketDate,
        statement: c.statement,
        confirmedFacts: c.selectedFacts,
        evidence: c.evidence,
      }),
    });
    clearTimeout(timer);
    if (!res.ok) return deterministic;
    const data = (await res.json()) as { source?: string; draft?: string };
    if (data.source === "llm" && typeof data.draft === "string" && data.draft) {
      // Trust LLM output only after passing the same guards used server-side.
      assertNoFabrication(data.draft, allowedTextFor(c));
      assertNoOutcomeClaims(data.draft);
      // If the LLM failed to translate and left non-English text, do not trust
      // it as an English letter — fall back to the deterministic draft, which
      // inserts an explicit translation-needed warning (P0 #3).
      if (needsTranslationToEnglish(data.draft)) return deterministic;
      return data.draft;
    }
    if (data.source === "deterministic" && typeof data.draft === "string") {
      return data.draft;
    }
    return deterministic;
  } catch {
    return deterministic;
  }
}
