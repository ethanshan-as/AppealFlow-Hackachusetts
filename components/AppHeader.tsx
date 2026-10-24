"use client";

import Link from "next/link";
import { useLang } from "./LangContext";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { useMode } from "./ModeContext";

export function AppHeader({
  subtitle,
  showModeToggle = false,
}: {
  subtitle?: string;
  showModeToggle?: boolean;
}) {
  const { t } = useLang();
  return (
    <header className="mb-6 flex flex-col gap-3 border-b border-slate-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <Link href="/" className="text-xl font-bold text-slate-900">
          {t("app.name")}
        </Link>
        <nav className="flex gap-3 text-sm" aria-label="primary">
          <Link href="/resident" className="text-slate-600 hover:text-brand-700">
            {t("nav.resident")}
          </Link>
          <Link href="/reviewer" className="text-slate-600 hover:text-brand-700">
            {t("nav.reviewer")}
          </Link>
        </nav>
        {subtitle ? (
          <span className="text-sm text-slate-400">· {subtitle}</span>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        {showModeToggle ? <ModeToggle /> : null}
        <LanguageSwitcher />
      </div>
    </header>
  );
}

function ModeToggle() {
  const { t } = useLang();
  const { mode, toggle } = useMode();
  return (
    <button
      type="button"
      onClick={toggle}
      className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
    >
      {mode === "simple" ? t("mode.switchToAdvanced") : t("mode.switchToSimple")}
    </button>
  );
}
