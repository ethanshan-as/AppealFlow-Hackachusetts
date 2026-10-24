"use client";

import { AppealCase } from "@/lib/case";
import { caseCounts, isEvidenceVerified } from "@/lib/caseInsights";
import { officialSources } from "@/lib/rules";
import { useLang } from "./LangContext";
import { Badge, SectionCard } from "./ui";

/**
 * Case intelligence (P2 #8, #9, #10). Every number is a count of actual case
 * data — no external datasets, no fabricated statistics. The trace links each
 * claim to its attached evidence and to a traceable official rule source.
 */

// Map a scenario to the most relevant official source id (traceable, not
// invented). Sources come only from data/official_sources.json.
function ruleForScenario(scenario: string): string {
  switch (scenario) {
    case "payment":
      return "boston_faq";
    case "breakdown":
      return "boston_faq";
    default:
      return "boston_appeal";
  }
}

export function CaseInsights({ active }: { active: AppealCase }) {
  const { t } = useLang();
  const counts = caseCounts(active);
  const sources = officialSources();
  const rule = sources.find((s) => s.id === ruleForScenario(active.scenario)) ?? sources[0];
  const verifiedEvidence = active.evidence.filter(isEvidenceVerified);

  return (
    <SectionCard title={t("insights.title")}>
      {/* Counts grid — all from real case data */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label={t("insights.claims")} value={counts.claims} />
        <Stat label={t("insights.verified")} value={counts.evidenceVerified} tone="green" />
        <Stat label={t("insights.missing")} value={counts.missingInformation} tone="amber" />
        <Stat
          label={t("insights.unsupported")}
          value={counts.unsupportedClaims}
          tone={counts.unsupportedClaims > 0 ? "red" : "slate"}
        />
      </dl>

      {/* Claim → Evidence → Official rule trace */}
      <h3 className="mb-2 mt-5 text-sm font-semibold text-slate-800">
        {t("insights.traceTitle")}
      </h3>
      {active.selectedFacts.length === 0 ? (
        <p className="text-sm text-slate-500">{t("insights.noTrace")}</p>
      ) : (
        <ul className="space-y-3">
          {active.selectedFacts.map((f) => (
            <li
              key={f.id}
              className="rounded-md border border-slate-200 p-3 text-sm"
            >
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                <div className="flex-1">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                    {t("insights.traceClaim")}
                  </span>
                  <span className="text-slate-800">{f.text}</span>
                </div>
                <span aria-hidden className="text-slate-300">
                  →
                </span>
                <div className="flex-1">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                    {t("insights.traceEvidence")}
                  </span>
                  {verifiedEvidence.length > 0 ? (
                    verifiedEvidence.map((e, i) => (
                      <Badge key={i} tone="green">
                        {e.label}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-amber-700">
                      {t("insights.noEvidence")}
                    </span>
                  )}
                </div>
                <span aria-hidden className="text-slate-300">
                  →
                </span>
                <div className="flex-1">
                  <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-slate-400">
                    {t("insights.traceRule")}
                  </span>
                  <a
                    href={rule.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-brand-700 hover:underline"
                  >
                    {rule.title}
                  </a>
                  <span className="mt-0.5 block text-xs italic text-amber-800">
                    ⚠ {t("ui.verifyOfficial")}
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </SectionCard>
  );
}

function Stat({
  label,
  value,
  tone = "slate",
}: {
  label: string;
  value: number;
  tone?: "slate" | "green" | "amber" | "red";
}) {
  const color: Record<string, string> = {
    slate: "text-slate-900",
    green: "text-green-700",
    amber: "text-amber-700",
    red: "text-red-700",
  };
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-center">
      <dd className={"text-2xl font-bold " + color[tone]}>{value}</dd>
      <dt className="mt-1 text-xs text-slate-500">{label}</dt>
    </div>
  );
}
