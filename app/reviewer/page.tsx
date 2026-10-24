"use client";

import { AppHeader } from "@/components/AppHeader";
import { ReviewerDashboard } from "@/components/ReviewerDashboard";
import { useLang } from "@/components/LangContext";

export default function ReviewerPage() {
  const { t } = useLang();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <AppHeader subtitle={t("nav.reviewer")} />
      <ReviewerDashboard />
    </main>
  );
}
