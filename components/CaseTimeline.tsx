"use client";

import { ProvenanceEntry } from "@/lib/case";
import { useLang } from "./LangContext";

const KIND_ICON: Record<string, string> = {
  case_created: "📄",
  fact_added: "➕",
  fact_edited: "✏️",
  fact_removed: "➖",
  evidence_added: "📎",
  evidence_status_changed: "🔁",
  status_changed: "🚦",
  draft_generated: "📝",
  clarification_requested: "❓",
  clarification_responded: "💬",
};

export function CaseTimeline({ entries }: { entries: ProvenanceEntry[] }) {
  const { t } = useLang();
  if (entries.length === 0) {
    return <p className="text-sm text-slate-500">{t("reviewer.noMissing")}</p>;
  }
  return (
    <ol className="space-y-2" aria-label={t("reviewer.history")}>
      {entries.map((e) => (
        <li key={e.id} className="flex items-start gap-3 text-sm">
          <span aria-hidden className="mt-0.5">
            {KIND_ICON[e.kind] ?? "•"}
          </span>
          <div>
            <p className="text-slate-800">{e.summary}</p>
            <time className="text-xs text-slate-400" dateTime={e.at}>
              {new Date(e.at).toLocaleString()}
            </time>
          </div>
        </li>
      ))}
    </ol>
  );
}
