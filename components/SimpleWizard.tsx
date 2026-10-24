"use client";

import { useMemo, useState } from "react";
import demoCases from "@/data/demo_cases.json";
import { AppealCase, Scenario, SCENARIOS, makeId } from "@/lib/case";
import {
  answerEntry,
  isStubScenario,
  nextQuestion,
  presentedChoices,
  totalQuestionsFor,
} from "@/lib/questions";
import { resolveDraft } from "@/lib/draftClient";
import { useCase } from "@/lib/useCase";
import { useLang } from "./LangContext";
import { Badge, ErrorNote, IndependenceNotice, Spinner, StatusBadge } from "./ui";
import { MicButton, ReadAloudButton } from "./voice";
import { CaseInsights } from "./CaseInsights";

/**
 * Simple Mode (P1 #5, #6): one question per screen, large buttons, 18px+ text,
 * a progress indicator, Back and Next, and voice input where supported with a
 * text fallback everywhere. Uses the same Case_Store and deterministic logic as
 * Advanced Mode so nothing behaves differently underneath.
 */

const BIG_BTN =
  "w-full rounded-xl border-2 px-5 py-4 text-left text-lg font-medium transition " +
  "focus-visible:outline-none min-h-[3.5rem]";

export function SimpleWizard() {
  const store = useCase();
  const active = store.activeCase;
  if (!active) return <SimpleStart store={store} />;
  return <SimpleFlow key={active.caseId} store={store} active={active} />;
}

function SimpleStart({ store }: { store: ReturnType<typeof useCase> }) {
  const { t } = useLang();
  return (
    <div className="space-y-6 text-[1.05rem]">
      <IndependenceNotice />
      <h2 className="text-2xl font-bold text-slate-900">{t("resident.pickCase")}</h2>
      <p className="text-slate-600">{t("resident.pickCase.desc")}</p>
      <div className="grid gap-4">
        {(demoCases as AppealCase[]).map((raw) => (
          <button
            key={raw.caseId}
            type="button"
            onClick={() => store.seedFromDemo(raw)}
            className={BIG_BTN + " border-slate-200 bg-white hover:border-brand-600 hover:bg-brand-50"}
          >
            <span className="mb-1 flex items-center gap-2">
              <Badge tone="amber">DEMO · FICTIONAL</Badge>
            </span>
            <span className="block font-semibold text-slate-900">{raw.violationType}</span>
            <span className="mt-1 block text-base text-slate-600">{raw.statement}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function SimpleFlow({
  store,
  active,
}: {
  store: ReturnType<typeof useCase>;
  active: AppealCase;
}) {
  const { t } = useLang();
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const currentQuestion = useMemo(() => nextQuestion(active), [active]);
  const needsScenario =
    active.answeredQuestionIds.length === 0 &&
    !isStubScenario(active.scenario) &&
    active.scenario !== "other" &&
    currentQuestion !== null &&
    active.selectedFacts.length === 0 &&
    !active.pickedScenario;

  // total/current for the progress indicator
  const total = isStubScenario(active.scenario)
    ? 1
    : totalQuestionsFor(active.scenario) || 1;
  const answeredCount = active.answeredQuestionIds.length;
  const current = Math.min(answeredCount + 1, total);

  const setScenario = (scenario: Scenario) => {
    store.save({ ...active, scenario, answeredQuestionIds: [], pickedScenario: true });
  };

  const answer = (label: string, qId: string, cId: string) => {
    try {
      store.save({
        ...active,
        answeredQuestionIds: [...active.answeredQuestionIds, answerEntry(qId, cId)],
        pickedScenario: true,
      });
      store.addFact(label, { source: "resident_answer", verificationStatus: "claimed" });
      setError(null);
    } catch {
      setError(t("ui.error"));
    }
  };

  const goBack = () => {
    // Pop the last answer and its derived fact.
    const nextAnswered = active.answeredQuestionIds.slice(0, -1);
    const nextFacts = active.selectedFacts.slice(0, -1);
    store.save({ ...active, answeredQuestionIds: nextAnswered, selectedFacts: nextFacts });
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      const draft = await resolveDraft(active);
      store.setDraft(draft);
      if (active.status === "draft") store.setStatus("ready");
    } catch {
      setError(t("ui.error"));
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div className="space-y-6 text-[1.05rem]">
      <IndependenceNotice />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone="amber">DEMO</Badge>
          <StatusBadge status={active.status} />
        </div>
        <button
          type="button"
          onClick={() => store.setActive("")}
          className="text-base text-slate-500 hover:text-slate-800"
        >
          ↺ {t("resident.back")}
        </button>
      </div>

      {error ? <ErrorNote message={error} /> : null}

      {/* Progress indicator */}
      {(needsScenario || currentQuestion) && !active.draft ? (
        <div>
          <div
            className="mb-2 text-base font-medium text-slate-600"
            aria-live="polite"
          >
            {t("simple.progress")
              .replace("{current}", String(current))
              .replace("{total}", String(total))}
          </div>
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-slate-200"
            role="progressbar"
            aria-valuenow={current}
            aria-valuemin={1}
            aria-valuemax={total}
          >
            <div
              className="h-full bg-brand-600 transition-all"
              style={{ width: `${(current / total) * 100}%` }}
            />
          </div>
        </div>
      ) : null}

      {/* Scenario choice */}
      {needsScenario ? (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-slate-900">
            {t("simple.chooseScenario")}
          </h2>
          <div className="grid gap-3">
            {SCENARIOS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScenario(s)}
                className={BIG_BTN + " border-slate-200 bg-white hover:border-brand-600 hover:bg-brand-50"}
              >
                {t(`resident.scenario.${s}`)}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {/* One question per screen */}
      {!needsScenario && currentQuestion ? (
        <div className="space-y-4">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-2xl font-bold text-slate-900">
              {t(currentQuestion.promptKey)}
            </h2>
            <ReadAloudButton text={t(currentQuestion.promptKey)} />
          </div>
          <div className="grid gap-3">
            {presentedChoices(currentQuestion).map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() => answer(t(ch.labelKey), currentQuestion.id, ch.id)}
                className={BIG_BTN + " border-slate-200 bg-white hover:border-brand-600 hover:bg-brand-50"}
              >
                {t(ch.labelKey)}
              </button>
            ))}
          </div>
          {/* Voice input with text fallback (P1 #6) */}
          <div className="flex flex-wrap items-center gap-3">
            <MicButton
              onTranscript={(text) => answer(text, currentQuestion.id, "other_not_sure")}
            />
          </div>
          <div className="flex items-center justify-between pt-2">
            <button
              type="button"
              onClick={goBack}
              disabled={answeredCount === 0}
              className="rounded-lg border-2 border-slate-300 px-5 py-3 text-lg font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-40"
            >
              ← {t("resident.back")}
            </button>
          </div>
        </div>
      ) : null}

      {/* Stub scenarios + manual text — free-text with voice fallback */}
      {(isStubScenario(active.scenario) || active.scenario === "other") &&
      !currentQuestion &&
      active.selectedFacts.length === 0 ? (
        <SimpleFreeText store={store} />
      ) : null}

      {/* Case insights (P2) */}
      {active.selectedFacts.length > 0 ? <CaseInsights active={active} /> : null}

      {/* Draft */}
      {active.selectedFacts.length > 0 || active.statement ? (
        <div className="space-y-3">
          {active.draft ? (
            <SimpleDraft store={store} active={active} />
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="w-full rounded-xl bg-brand-600 px-6 py-4 text-lg font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {generating ? <Spinner /> : t("resident.generate")}
            </button>
          )}
        </div>
      ) : null}

      {/* Clarification */}
      {active.status === "clarification_requested" && active.clarification ? (
        <SimpleClarification store={store} active={active} />
      ) : null}
    </div>
  );
}

function SimpleFreeText({ store }: { store: ReturnType<typeof useCase> }) {
  const { t } = useLang();
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-slate-900">{t("q.stub")}</h2>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("resident.manual.placeholder")}
        className="h-32 w-full rounded-lg border-2 border-slate-300 p-4 text-lg"
        aria-label={t("resident.manual")}
      />
      <p className="text-sm text-amber-800">{t("resident.noPii")}</p>
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            store.addFact(text.trim(), { source: "resident_answer", verificationStatus: "claimed" });
            setText("");
          }}
          className="rounded-xl bg-brand-600 px-6 py-3 text-lg font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {t("resident.next")}
        </button>
        <MicButton onTranscript={(v) => setText((p) => `${p} ${v}`.trim())} />
      </div>
    </div>
  );
}

function SimpleDraft({
  store,
  active,
}: {
  store: ReturnType<typeof useCase>;
  active: AppealCase;
}) {
  const { t } = useLang();
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(active.draft ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      /* select manually */
    }
  };
  const download = () => {
    const blob = new Blob([active.draft ?? ""], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `appeal-${active.caseId}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-slate-900">{t("resident.draft")}</h2>
      {active.draft?.includes("Translation needed") ? (
        <p className="rounded-md bg-amber-50 px-4 py-3 text-base text-amber-900">
          ⚠ {t("translation.needed")}
        </p>
      ) : null}
      <textarea
        value={active.draft}
        onChange={(e) => store.save({ ...active, draft: e.target.value })}
        className="h-80 w-full rounded-lg border-2 border-slate-300 p-4 font-mono text-base"
        aria-label={t("resident.draft")}
      />
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={copy}
          className="rounded-xl bg-brand-600 px-6 py-3 text-lg font-semibold text-white hover:bg-brand-700"
        >
          {copied ? t("resident.copied") : t("resident.copy")}
        </button>
        <button
          type="button"
          onClick={download}
          className="rounded-xl border-2 border-slate-300 px-6 py-3 text-lg font-medium text-slate-700 hover:bg-slate-100"
        >
          {t("resident.download")}
        </button>
      </div>
      <p className="rounded-md bg-slate-50 px-4 py-3 text-base text-slate-600">
        {t("resident.submitNote")}
      </p>
    </div>
  );
}

function SimpleClarification({
  store,
  active,
}: {
  store: ReturnType<typeof useCase>;
  active: AppealCase;
}) {
  const { t } = useLang();
  const [text, setText] = useState("");
  return (
    <div className="space-y-3">
      <h2 className="text-2xl font-bold text-slate-900">
        {t("resident.clarification.title")}
      </h2>
      <p className="rounded-md bg-amber-50 px-4 py-3 text-lg text-amber-900">
        ❓ {active.clarification?.text}
      </p>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-28 w-full rounded-lg border-2 border-slate-300 p-4 text-lg"
        placeholder={t("resident.clarification.respond")}
        aria-label={t("resident.clarification.respond")}
      />
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            store.respondClarification(text.trim());
            setText("");
          }}
          className="rounded-xl bg-brand-600 px-6 py-3 text-lg font-semibold text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {t("resident.clarification.send")}
        </button>
        <MicButton onTranscript={(v) => setText((p) => `${p} ${v}`.trim())} />
      </div>
    </div>
  );
}
