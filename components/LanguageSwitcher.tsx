"use client";

import { LANGS, LANG_LABELS } from "@/lib/translations";
import { useLang } from "./LangContext";

export function LanguageSwitcher() {
  const { lang, setLang, t } = useLang();
  return (
    <div className="flex items-center gap-2" role="group" aria-label={t("lang.label")}>
      <span className="sr-only">{t("lang.label")}</span>
      {LANGS.map((l) => {
        const active = l === lang;
        return (
          <button
            key={l}
            type="button"
            onClick={() => setLang(l)}
            aria-pressed={active}
            className={[
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
              active
                ? "bg-brand-600 text-white"
                : "bg-white text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100",
            ].join(" ")}
          >
            {LANG_LABELS[l]}
          </button>
        );
      })}
    </div>
  );
}
