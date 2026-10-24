/**
 * Lightweight script detection to prevent untranslated Chinese or Spanish from
 * appearing in an English appeal letter as though it were translated (P0 #3).
 *
 * Detection is heuristic and conservative: we flag text that contains CJK
 * characters, or Spanish-specific letters/marks that do not belong in plain
 * English. The draft generator uses this to either (a) translate via a
 * configured LLM, or (b) surface a clear "translation needed" warning instead
 * of silently embedding non-English text.
 */

/** Returns true if the text contains Han (Chinese) characters. */
export function containsChinese(text: string): boolean {
  // CJK Unified Ideographs + common extension blocks.
  return /[\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/.test(text);
}

/**
 * Returns true if the text contains Spanish-specific characters that would not
 * appear in ordinary English (ñ, ¿, ¡, and accented vowels / ü).
 */
export function containsSpanishMarkers(text: string): boolean {
  return /[ñ¿¡áéíóúü]/i.test(text);
}

/**
 * Returns true when the text is not safe to drop verbatim into an English
 * letter because it contains non-English script that has not been translated.
 */
export function needsTranslationToEnglish(text: string): boolean {
  return containsChinese(text) || containsSpanishMarkers(text);
}

export interface TranslationScan {
  needsTranslation: boolean;
  /** Indices of facts (within the provided list) that need translation. */
  untranslatedFactIndexes: number[];
}

export function scanFactsForTranslation(texts: string[]): TranslationScan {
  const untranslatedFactIndexes: number[] = [];
  texts.forEach((t, i) => {
    if (needsTranslationToEnglish(t)) untranslatedFactIndexes.push(i);
  });
  return {
    needsTranslation: untranslatedFactIndexes.length > 0,
    untranslatedFactIndexes,
  };
}
