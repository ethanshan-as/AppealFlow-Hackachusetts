"use client";

import { AppealCase } from "@/lib/case";
import { officialSources } from "@/lib/rules";
import { useLang } from "./LangContext";
import { Badge, SectionCard } from "./ui";

/**
 * Official submission handoff (P3). Boston parking tickets are reviewed by the
 * City of Boston Office of the Parking Clerk (not the RMV). We provide a clear
 * link to the official appeal portal, a copyable draft (handled by the draft
 * panel), and an evidence checklist. We never submit for the resident and never
 * mark a ticket submitted without a genuine official receipt. No scraping or
 * form automation.
 */
export function SubmissionHandoff({ active }: { active: AppealCase }) {
  const { t } = useLang();
  const portal =
    officialSources().find((s) => s.id === "boston_appeal") ??
    officialSources()[0];

  const attached = active.evidence.filter((e) => e.status === "uploaded");
  const stillNeeded = active.evidence.filter((e) => e.status !== "uploaded");

  return (
    <SectionCard title={t("handoff.title")}>
      <p className="mb-3 rounded-md bg-slate-50 px-3 py-2 text-sm text-slate-700">
        {t("handoff.reviewedBy")}
      </p>

      <a
        href={portal.url}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-block rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        ↗ {t("handoff.openPortal")}
      </a>

      <h3 className="mb-2 mt-4 text-sm font-semibold text-slate-800">
        {t("handoff.checklist")}
      </h3>
      <ul className="space-y-1.5 text-sm">
        <li className="flex items-center gap-2">
          <Badge tone={active.draft ? "green" : "slate"}>
            {active.draft ? "✓" : "•"}
          </Badge>
          {t("handoff.checkDraft")}
        </li>
        <li className="flex items-center gap-2">
          <Badge tone={attached.length > 0 ? "green" : "slate"}>
            {attached.length}
          </Badge>
          {t("handoff.checkAttached")}
          {attached.length > 0 ? (
            <span className="text-slate-500">
              ({attached.map((e) => e.label).join(", ")})
            </span>
          ) : null}
        </li>
        {stillNeeded.length > 0 ? (
          <li className="flex items-start gap-2">
            <Badge tone="amber">{stillNeeded.length}</Badge>
            <span>
              {t("handoff.checkMissing")}:{" "}
              <span className="text-slate-600">
                {stillNeeded.map((e) => e.label).join(", ")}
              </span>
            </span>
          </li>
        ) : null}
      </ul>

      <p className="mt-3 text-xs italic text-amber-800">⚠ {t("handoff.noAuto")}</p>
    </SectionCard>
  );
}
