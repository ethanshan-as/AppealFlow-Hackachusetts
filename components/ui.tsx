"use client";

import { useLang } from "./LangContext";

export function IndependenceNotice({ className = "" }: { className?: string }) {
  const { t } = useLang();
  return (
    <div
      role="note"
      className={
        "rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-900 " +
        className
      }
    >
      <strong className="font-semibold">⚠ </strong>
      {t("app.independence")}
    </div>
  );
}

export function Badge({
  children,
  tone = "slate",
}: {
  children: React.ReactNode;
  tone?: "slate" | "blue" | "green" | "amber" | "red";
}) {
  const tones: Record<string, string> = {
    slate: "bg-slate-100 text-slate-700 ring-slate-300",
    blue: "bg-blue-100 text-blue-800 ring-blue-300",
    green: "bg-green-100 text-green-800 ring-green-300",
    amber: "bg-amber-100 text-amber-900 ring-amber-300",
    red: "bg-red-100 text-red-800 ring-red-300",
  };
  return (
    <span
      className={
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1 " +
        tones[tone]
      }
    >
      {children}
    </span>
  );
}

export function StatusBadge({ status }: { status: string }) {
  const { t } = useLang();
  const tone =
    status === "ready"
      ? "green"
      : status === "clarification_requested"
        ? "amber"
        : status === "simulated_outcome"
          ? "blue"
          : "slate";
  return <Badge tone={tone}>{t(`status.${status}`)}</Badge>;
}

export function Spinner({ label }: { label?: string }) {
  const { t } = useLang();
  return (
    <span
      role="status"
      aria-live="polite"
      className="inline-flex items-center gap-2 text-sm text-slate-600"
    >
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" />
      {label ?? t("ui.loading")}
    </span>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div
      role="alert"
      className="rounded-md border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800"
    >
      {message}
    </div>
  );
}

export function SectionCard({
  title,
  children,
  id,
}: {
  title: React.ReactNode;
  children: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      id={id}
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm"
      aria-label={typeof title === "string" ? title : undefined}
    >
      <h2 className="mb-3 text-lg font-semibold text-slate-900">{title}</h2>
      {children}
    </section>
  );
}
