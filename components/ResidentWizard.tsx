"use client";

import { useMemo, useState } from "react";
import demoCases from "@/data/demo_cases.json";
import {
  AppealCase,
  Evidence,
  EvidenceStatus,
  Scenario,
  SCENARIOS,
  makeId,
} from "@/lib/case";
import {
  answerEntry,
  isStubScenario,
  nextQuestion,
  presentedChoices,
  STUB_FLOW,
} from "@/lib/questions";
import { resolveDraft } from "@/lib/draftClient";
import { buildPreview } from "@/lib/media";
import { useCase } from "@/lib/useCase";
import { useLang } from "./LangContext";
import { Badge, ErrorNote, IndependenceNotice, SectionCard, Spinner, StatusBadge } from "./ui";
import { MicButton, ReadAloudButton } from "./voice";
import { CaseTimeline } from "./CaseTimeline";
import { CaseInsights } from "./CaseInsights";
import { SubmissionHandoff } from "./SubmissionHandoff";

const EVIDENCE_KINDS = [
  "payment_receipt",
  "tow_receipt",
  "photo",
  "statement",
  "other",
];
const EVIDENCE_STATUSES: EvidenceStatus[] = ["uploaded", "simulated", "missing"];

export function ResidentWizard() {
  const { t } = useLang();
  const store = useCase();
  const active = store.activeCase;

  // ---- No active case: choose a demo case or start a blank one ----
  if (!active) {
    return <CaseStart store={store} />;
  }

  return <ActiveCaseFlow key={active.caseId} store={store} active={active} />;
}

/* -------------------------------------------------------------------------- */

function CaseStart({ store }: { store: ReturnType<typeof useCase> }) {
  const { t } = useLang();
  const [manual, setManual] = useState("");

  const startManual = () => {
    const blank: AppealCase = {
      caseId: makeId("case"),
      isSynthetic: true,
      city: "Boston",
      violationType: "Parking citation",
      ticketDate: "",
      scenario: "other",
      residencyLanguage: "en",
      statement: manual.trim(),
      selectedFacts: [],
      evidence: [],
      status: "draft",
      provenance: [],
      answeredQuestionIds: [],
    };
    store.save(blank);
    store.setActive(blank.caseId);
  };

  return (
    <div className="space-y-6">
      <IndependenceNotice />
      <SectionCard title={t("resident.pickCase")}>
        <p className="mb-4 text-sm text-slate-600">{t("resident.pickCase.desc")}</p>
        <div className="grid gap-3 sm:grid-cols-2">
          {(demoCases as AppealCase[]).map((raw) => (
            <button
              key={raw.caseId}
              type="button"
              onClick={() => store.seedFromDemo(raw)}
              className="rounded-lg border border-slate-200 p-4 text-left hover:border-brand-600 hover:bg-brand-50"
            >
              <div className="mb-1 flex items-center gap-2">
                <Badge tone="amber">DEMO · FICTIONAL</Badge>
                <span className="text-xs text-slate-400">{raw.caseId}</span>
              </div>
              <p className="font-medium text-slate-900">{raw.violationType}</p>
              <p className="mt-1 text-sm text-slate-600 line-clamp-3">
                {raw.statement}
              </p>
            </button>
          ))}
        </div>
      </SectionCard>

      <SectionCard title={t("resident.manual")}>
        <label htmlFor="manual" className="sr-only">
          {t("resident.manual")}
        </label>
        <textarea
          id="manual"
          value={manual}
          onChange={(e) => setManual(e.target.value)}
          placeholder={t("resident.manual.placeholder")}
          className="h-28 w-full rounded-md border border-slate-300 p-3 text-sm"
        />
        <p className="mt-2 text-xs text-amber-800">{t("resident.noPii")}</p>
        <button
          type="button"
          onClick={startManual}
          className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {t("resident.manual.start")}
        </button>
      </SectionCard>
    </div>
  );
}

/* -------------------------------------------------------------------------- */

function ActiveCaseFlow({
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
  const scenarioChosen = active.answeredQuestionIds.length > 0 || isStubScenario(active.scenario);

  // Pick a scenario first if none of its questions have been answered yet and
  // the case is still in a built scenario with questions remaining.
  const needsScenario =
    active.answeredQuestionIds.length === 0 &&
    !isStubScenario(active.scenario) &&
    currentQuestion !== null &&
    active.scenario !== "other";

  const setScenario = (scenario: Scenario) => {
    store.save({ ...active, scenario, answeredQuestionIds: [] });
  };

  const answer = (choiceLabel: string, questionId: string, choiceId: string) => {
    try {
      // Record the branch progression, then derive a provenance-tagged Fact.
      const withEntry: AppealCase = {
        ...active,
        answeredQuestionIds: [...active.answeredQuestionIds, answerEntry(questionId, choiceId)],
      };
      store.save(withEntry);
      store.addFact(choiceLabel, {
        source: "resident_answer",
        verificationStatus: "claimed",
      });
      setError(null);
    } catch {
      setError(t("ui.error"));
    }
  };

  const generate = async () => {
    setGenerating(true);
    setError(null);
    try {
      // Tries the optional Appeal_Service, always falls back to deterministic.
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
    <div className="space-y-6">
      <IndependenceNotice />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge tone="amber">DEMO · FICTIONAL</Badge>
          <StatusBadge status={active.status} />
        </div>
        <button
          type="button"
          onClick={() => {
            store.save({ ...active });
            store.setActive("");
          }}
          className="text-sm text-slate-500 hover:text-slate-800"
        >
          ↺ {t("resident.back")}
        </button>
      </div>

      {error ? <ErrorNote message={error} /> : null}

      {/* Scenario picker */}
      {needsScenario ? (
        <SectionCard title={t("resident.pickScenario")}>
          <div className="grid gap-2">
            {SCENARIOS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setScenario(s)}
                className={[
                  "rounded-md border px-4 py-3 text-left text-sm",
                  s === active.scenario
                    ? "border-brand-600 bg-brand-50"
                    : "border-slate-200 hover:bg-slate-50",
                ].join(" ")}
              >
                {t(`resident.scenario.${s}`)}
                {isStubScenario(s) ? (
                  <span className="ml-2 text-xs text-slate-400">(stub)</span>
                ) : null}
              </button>
            ))}
          </div>
        </SectionCard>
      ) : null}

      {/* Guided question (built scenarios) */}
      {!needsScenario && currentQuestion ? (
        <SectionCard
          title={
            <span className="flex items-center gap-3">
              {t(currentQuestion.promptKey)}
              <ReadAloudButton text={t(currentQuestion.promptKey)} />
            </span>
          }
        >
          <div className="grid gap-2">
            {presentedChoices(currentQuestion).map((ch) => (
              <button
                key={ch.id}
                type="button"
                onClick={() =>
                  answer(t(ch.labelKey), currentQuestion.id, ch.id)
                }
                className="rounded-md border border-slate-200 px-4 py-3 text-left text-sm hover:border-brand-600 hover:bg-brand-50"
              >
                {t(ch.labelKey)}
              </button>
            ))}
          </div>
          <div className="mt-3">
            <MicButton
              onTranscript={(text) =>
                answer(text, currentQuestion.id, "other_not_sure")
              }
            />
          </div>
        </SectionCard>
      ) : null}

      {/* Stub scenario informational step */}
      {isStubScenario(active.scenario) ? (
        <SectionCard title={t(STUB_FLOW.promptKey)}>
          <StubStatement store={store} active={active} />
        </SectionCard>
      ) : null}

      {/* Fact review — shown once at least one fact exists */}
      {active.selectedFacts.length > 0 ? (
        <FactReview store={store} active={active} />
      ) : null}

      {/* Case intelligence */}
      {active.selectedFacts.length > 0 ? <CaseInsights active={active} /> : null}

      {/* Evidence */}
      {scenarioChosen ? <EvidenceEditor store={store} active={active} /> : null}

      {/* Draft generation + output */}
      {active.selectedFacts.length > 0 || active.statement ? (
        <SectionCard title={t("resident.draft")}>
          {active.draft ? (
            <DraftPanel store={store} active={active} />
          ) : (
            <button
              type="button"
              onClick={generate}
              disabled={generating}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
            >
              {generating ? <Spinner /> : t("resident.generate")}
            </button>
          )}
        </SectionCard>
      ) : null}

      {/* Clarification from reviewer */}
      {active.status === "clarification_requested" && active.clarification ? (
        <ClarificationReply store={store} active={active} />
      ) : null}

      {/* Provenance */}
      <SectionCard title={t("reviewer.history")}>
        <CaseTimeline entries={active.provenance} />
      </SectionCard>
    </div>
  );
}

function StubStatement({
  store,
  active,
}: {
  store: ReturnType<typeof useCase>;
  active: AppealCase;
}) {
  const { t } = useLang();
  const [text, setText] = useState("");
  return (
    <div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("resident.manual.placeholder")}
        className="h-24 w-full rounded-md border border-slate-300 p-3 text-sm"
        aria-label={t("resident.manual")}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            store.addFact(text.trim(), {
              source: "resident_answer",
              verificationStatus: "claimed",
            });
            setText("");
          }}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {t("resident.answer")}
        </button>
        <MicButton onTranscript={(v) => setText((prev) => `${prev} ${v}`.trim())} />
      </div>
    </div>
  );
}

function FactReview({
  store,
  active,
}: {
  store: ReturnType<typeof useCase>;
  active: AppealCase;
}) {
  const { t } = useLang();
  return (
    <SectionCard title={t("resident.reviewFacts")}>
      <p className="mb-3 text-sm text-slate-600">{t("resident.reviewFacts.desc")}</p>
      <ul className="space-y-3">
        {active.selectedFacts.map((f) => (
          <li
            key={f.id}
            className="rounded-md border border-slate-200 p-3"
          >
            <label htmlFor={`fact-${f.id}`} className="sr-only">
              {t("resident.reviewFacts")}
            </label>
            <input
              id={`fact-${f.id}`}
              value={f.text}
              onChange={(e) => store.editFact(f.id, e.target.value)}
              className="w-full rounded border border-slate-200 px-2 py-1 text-sm"
            />
            <div className="mt-2 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs">
                <Badge tone="blue">
                  {t("meta.source")}: {t(`source.${f.source}`)}
                </Badge>
                <Badge tone="slate">
                  {t("meta.verification")}: {t(`verification.${f.verificationStatus}`)}
                </Badge>
              </div>
              <button
                type="button"
                onClick={() => store.removeFact(f.id)}
                className="text-xs text-red-600 hover:underline"
              >
                ✕ {t("resident.skip")}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </SectionCard>
  );
}

function EvidenceEditor({
  store,
  active,
}: {
  store: ReturnType<typeof useCase>;
  active: AppealCase;
}) {
  const { t } = useLang();
  const [kind, setKind] = useState(EVIDENCE_KINDS[0]);
  const [label, setLabel] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<EvidenceStatus>("missing");
  const [preview, setPreview] = useState<string | null>(null);
  const [previewNote, setPreviewNote] = useState<string | null>(null);

  const add = () => {
    if (!label.trim()) return;
    const ev: Evidence = { kind, label: label.trim(), notes: notes.trim() || undefined, status };
    store.addEvidence(ev);
    setLabel("");
    setNotes("");
    setStatus("missing");
    setPreview(null);
  };

  return (
    <SectionCard title={t("resident.addEvidence")}>
      {active.evidence.length > 0 ? (
        <ul className="mb-4 space-y-2">
          {active.evidence.map((e, i) => (
            <li key={`${e.label}-${i}`} className="flex items-center justify-between rounded border border-slate-200 px-3 py-2 text-sm">
              <span>
                <span className="font-medium">{e.label}</span>{" "}
                <span className="text-slate-400">({e.kind})</span>
                {e.notes ? <span className="text-slate-500"> — {e.notes}</span> : null}
              </span>
              <select
                aria-label={t("resident.evidence.status")}
                value={e.status}
                onChange={(ev) => store.setEvidenceStatus(i, ev.target.value as EvidenceStatus)}
                className="rounded border border-slate-300 px-2 py-1 text-xs"
              >
                {EVIDENCE_STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {t(`evidenceStatus.${s}`)}
                  </option>
                ))}
              </select>
            </li>
          ))}
        </ul>
      ) : null}

      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">{t("resident.evidence.kind")}</span>
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            {EVIDENCE_KINDS.map((k) => (
              <option key={k} value={k}>
                {k}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">{t("resident.evidence.status")}</span>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as EvidenceStatus)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          >
            {EVIDENCE_STATUSES.map((s) => (
              <option key={s} value={s}>
                {t(`evidenceStatus.${s}`)}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">{t("resident.evidence.label")}</span>
          <input
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-slate-600">{t("resident.evidence.notes")}</span>
          <input
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full rounded border border-slate-300 px-2 py-1.5 text-sm"
          />
        </label>
      </div>

      {/* Client-only local image preview (never uploaded) */}
      <div className="mt-3">
        <label className="text-sm text-slate-600">
          <span className="mb-1 block">Photo preview (stays on your device)</span>
          <input
            type="file"
            accept="image/*,.heic,.heif"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              const result = buildPreview(file);
              if (result.kind === "image") {
                setPreview(result.url);
                setPreviewNote(null);
              } else {
                setPreview(null);
                setPreviewNote(result.message ?? t("ui.error"));
              }
            }}
            className="text-xs"
          />
        </label>
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={preview}
            alt="Local evidence preview"
            className="mt-2 max-h-40 rounded border border-slate-200"
          />
        ) : null}
        {previewNote ? (
          <p className="mt-2 rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-900">
            ⚠ {previewNote}
          </p>
        ) : null}
      </div>

      <button
        type="button"
        onClick={add}
        className="mt-3 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        {t("resident.evidence.add")}
      </button>
    </SectionCard>
  );
}

function DraftPanel({
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
      /* clipboard unsupported — user can select the text manually */
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
    <div>
      {active.draft?.includes("Translation needed") ? (
        <p className="mb-2 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
          ⚠ {t("translation.needed")}
        </p>
      ) : null}
      <textarea
        value={active.draft}
        onChange={(e) => store.save({ ...active, draft: e.target.value })}
        className="h-80 w-full rounded-md border border-slate-300 p-3 font-mono text-sm"
        aria-label={t("resident.draft")}
      />
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={copy}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
        >
          {copied ? t("resident.copied") : t("resident.copy")}
        </button>
        <button
          type="button"
          onClick={download}
          className="rounded-md bg-white px-4 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
        >
          {t("resident.download")}
        </button>
      </div>
      <p className="mt-3 rounded-md bg-slate-50 px-3 py-2 text-xs text-slate-600">
        {t("resident.submitNote")}
      </p>
      <div className="mt-4">
        <SubmissionHandoff active={active} />
      </div>
    </div>
  );
}

function ClarificationReply({
  store,
  active,
}: {
  store: ReturnType<typeof useCase>;
  active: AppealCase;
}) {
  const { t } = useLang();
  const [text, setText] = useState("");
  return (
    <SectionCard title={t("resident.clarification.title")}>
      <p className="mb-3 rounded-md bg-amber-50 px-3 py-2 text-sm text-amber-900">
        ❓ {active.clarification?.text}
      </p>
      <label htmlFor="clar-reply" className="sr-only">
        {t("resident.clarification.respond")}
      </label>
      <textarea
        id="clar-reply"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="h-24 w-full rounded-md border border-slate-300 p-3 text-sm"
        placeholder={t("resident.clarification.respond")}
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          disabled={!text.trim()}
          onClick={() => {
            store.respondClarification(text.trim());
            setText("");
          }}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-60"
        >
          {t("resident.clarification.send")}
        </button>
        <MicButton onTranscript={(v) => setText((prev) => `${prev} ${v}`.trim())} />
      </div>
    </SectionCard>
  );
}
