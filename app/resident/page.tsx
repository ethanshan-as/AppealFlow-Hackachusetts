"use client";

import { AppHeader } from "@/components/AppHeader";
import { ResidentWizard } from "@/components/ResidentWizard";
import { SimpleWizard } from "@/components/SimpleWizard";
import { useLang } from "@/components/LangContext";
import { useMode } from "@/components/ModeContext";

export default function ResidentPage() {
  const { t } = useLang();
  const { mode } = useMode();
  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <AppHeader subtitle={t("nav.resident")} showModeToggle />
      {mode === "simple" ? <SimpleWizard /> : <ResidentWizard />}
    </main>
  );
}
