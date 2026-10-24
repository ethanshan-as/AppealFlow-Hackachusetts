"use client";

import Link from "next/link";
import { useLang } from "@/components/LangContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { IndependenceNotice } from "@/components/ui";

export default function LandingPage() {
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <header className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">{t("app.name")}</h1>
          <p className="mt-1 text-slate-600">{t("app.tagline")}</p>
        </div>
        <LanguageSwitcher />
      </header>

      <IndependenceNotice className="mb-8" />

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/resident"
          className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-600 hover:shadow"
        >
          <h2 className="text-xl font-semibold text-slate-900 group-hover:text-brand-700">
            🧍 {t("landing.resident.title")}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("landing.resident.desc")}
          </p>
          <span className="mt-4 inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white">
            {t("nav.resident")} · {t("landing.start")}
          </span>
        </Link>

        <Link
          href="/reviewer"
          className="group rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition hover:border-brand-600 hover:shadow"
        >
          <h2 className="text-xl font-semibold text-slate-900 group-hover:text-brand-700">
            🗂️ {t("landing.reviewer.title")}
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            {t("landing.reviewer.desc")}
          </p>
          <span className="mt-4 inline-block rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white">
            {t("nav.reviewer")} · {t("landing.start")}
          </span>
        </Link>
      </div>
    </main>
  );
}
