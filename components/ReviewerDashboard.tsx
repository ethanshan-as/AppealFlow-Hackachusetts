"use client";

import { useState } from "react";
import { AppealCase } from "@/lib/case";
import { officialSources } from "@/lib/rules";
import { nextQuestion } from "@/lib/questions";
import { useCase } from "@/lib/useCase";
import { useLang } from "./LangContext";
import { Badge, ErrorNote, SectionCard, StatusBadge } from "./ui";
import { CaseTimeline } from "./CaseTimeline";
import { CaseInsights } from "./CaseInsights";

export function ReviewerDashboard() {
  const { t } = useLang();
  const store = useCase();
  const cases = store.cases;
  const active = store.activeCase;

  if (cases.length === 0) {
    return (
      <SectionCard title={t("reviewer.title")}>
        <p className="mb-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {t("reviewer.notCity")}
        </p>
        <p className="text-sm text-slate-500">{t("reviewer.noCase")}</p>
      </SectionCard>
    );
  }

  return (
    <div className="space-y-6">
      <SectionCard title={t("reviewer.selectCase")}>
        <p className="mb-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
          {t("reviewer.notCity")}
        </p>
        <div className="flex flex-wrap gap-2">
          {cases.map((c) => (
            <button
              key={c.caseId}
              type="button"
              onClick={() => store.setActive(c.caseId)}
              className={[
                "rounded-md border px-3 py-2 text-sm",
                active?.caseId === c.caseId
                  ? "border-brand-600 bg-brand-50"
                  : "border-slate-200 hover:bg-slate-50",
              ].join(" ")}
            >
              <span className="font-medium">{c.caseId}</span>{" "}
              <StatusBadge status={c.status} />
            </button>
          ))}
        </div>
      </SectionCard>

      {active ? <ReviewerCaseView store={store} active={active} /> : null}
    </div>
  );
}

function missingInfo(active: AppealCase, t: (k: string) => string): string[] {
  const items: string[] = [];
  for (const e of active.evidence) {
    if (e.status === "missing") {
      items.push(`${e.label} — ${t("evidenceStatus.missing")}`);
    }
  }
  if (nextQuestion(active) !== null) {
    items.push("The guided questions are not fully completed.");
  }
  if (active.selectedFacts.length === 0) {
    items.push("No claims have been recorded yet.");
  }
  return items;
}

function ReviewerCaseView({
  store,
  active,
}: {
  store: ReturnType<typeof useCase>;
  active: AppealCase;
}) {
  const { t } = useLang();
  const [question, setQuestion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const missing = missingInfo(active, t);
  const sources = officialSources();

  const sendClarification = () => {
    if (!question.trim()) return;
    try {
      store.requestClarification(question.trim());
      setQuestion("");
      setError(null);
    } catch {
      setError(t("ui.error"));
    }
  };

  const recordOutcome = () => {
    // Simulated demo outcome only; requires this explicit human click.
    try {
      if (active.status === "ready" || active.status === "submission_unverified") {
        store.setStatus("simulated_outcome");
        setError(null);
      } else {
        setError(t("ui.error"));
      }
    } catch {
      setError(t("ui.error"));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Badge tone="amber">DEMO · SIMULATED REVIEW</Badge>
        <StatusBadge status={active.status} />
      </div>

      {error ? <ErrorNote message={error} /> : null}

      <CaseInsights active={active} />

      <SectionCard title={t("reviewer.claims")}>
        {active.selectedFacts.length === 0 ? (
          <p className="text-sm text-slate-500">—</p>
        ) : (
          <ul className="space-y-2">
            {active.selectedFacts.map((f) => (
              <li key={f.id} className="rounded-md border border-slate-200 p-3 text-sm">
                <p className="text-slate-800">{f.text}</p>
                <div className="mt-2 flex gap-2">
                  <Badge tone="blue">{t(`source.${f.source}`)}</Badge>
                  <Badge tone="slate">{t(`verification.${f.verificationStatus}`)}</Badge>
                </div>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={t("reviewer.evidence")}>
        {active.evidence.length === 0 ? (
          <p className="text-sm text-slate-500">—</p>
        ) : (
          <ul className="space-y-2">
            {active.evidence.map((e, i) => (
              <li key={`${e.label}-${i}`} className="flex items-center justify-between rounded-md border border-slate-200 p-3 text-sm">
                <span>
                  <span className="font-medium">{e.label}</span>{" "}
                  <span className="text-slate-400">({e.kind})</span>
                  {e.notes ? <span className="text-slate-500"> — {e.notes}</span> : null}
                </span>
                <Badge
                  tone={e.status === "uploaded" ? "green" : e.status === "missing" ? "red" : "amber"}
                >
                  {t(`evidenceStatus.${e.status}`)}
                </Badge>
              </li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={t("reviewer.missing")}>
        {missing.length === 0 ? (
          <p className="text-sm text-slate-500">{t("reviewer.noMissing")}</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {missing.map((m, i) => (
              <li key={i}>{m}</li>
            ))}
          </ul>
        )}
      </SectionCard>

      <SectionCard title={t("reviewer.sources")}>
        <ul className="space-y-3">
          {sources.map((s) => (
            <li key={s.id} className="text-sm">
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-brand-700 hover:underline"
              >
                {s.title}
              </a>
              <p className="text-slate-500">{s.purpose}</p>
              <p className="mt-0.5 text-xs italic text-amber-800">
                ⚠ {t("ui.verifyOfficial")}: {s.verificationNote}
              </p>
            </li>
          ))}
        </ul>
      </SectionCard>

      {active.hardshipContext ? (
        <SectionCard title={t("reviewer.hardship")}>
          <p className="text-sm text-slate-700">{active.hardshipContext}</p>
        </SectionCard>
      ) : null}

      {active.originalLanguageExcerpt || active.residencyLanguage !== "en" ? (
        <SectionCard title={t("reviewer.original")}>
          <p className="text-sm text-slate-700">
            {active.originalLanguageExcerpt ??
              `Resident's selected language: ${active.residencyLanguage}. Original statement: ${active.statement}`}
          </p>
        </SectionCard>
      ) : null}

      <SectionCard title={t("reviewer.uncertain")}>
        <p className="text-sm text-slate-700">
          {missing.length > 0
            ? `The following remain unverified or incomplete: ${missing.join("; ")}.`
            : "All reported items are present, but claims remain the resident's statements until independently verified."}
        </p>
      </SectionCard>

      <SectionCard title={t("reviewer.requestClarification")}>
        {active.clarification ? (
          <div className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
            <p>❓ {active.clarification.text}</p>
            {active.clarificationResponse ? (
              <p className="mt-2 text-green-800">💬 {active.clarificationResponse.text}</p>
            ) : (
              <p className="mt-1 text-xs text-amber-700">Awaiting resident response…</p>
            )}
          </div>
        ) : null}
        <label htmlFor="clar-q" className="sr-only">
          {t("reviewer.requestClarification")}
        </label>
        <input
          id="clar-q"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder={t("reviewer.clarification.placeholder")}
          className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm"
        />
        <button
          type="button"
          disabled={!question.trim()}
          onClick={sendClarification}
          className="mt-2 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {t("reviewer.clarification.send")}
        </button>
      </SectionCard>

      <SectionCard title={t("reviewer.recordOutcome")}>
        <p className="mb-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
          {t("reviewer.outcome.note")}
        </p>
        <button
          type="button"
          onClick={recordOutcome}
          className="rounded-md bg-slate-700 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          {t("reviewer.recordOutcome")}
        </button>
      </SectionCard>

      <SectionCard title={t("reviewer.history")}>
        <CaseTimeline entries={active.provenance} />
      </SectionCard>
    </div>
  );
}
