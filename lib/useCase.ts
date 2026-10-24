"use client";

/**
 * React hook wrapper over the framework-agnostic Case_Store (lib/case.ts).
 *
 * Kept separate from case.ts so the domain logic remains pure and
 * unit-testable without React. The hook subscribes to the store, to the
 * `storage` event (cross-route/tab updates in the same browser), and to
 * focus/visibility (same-tab navigation where `storage` does not fire), so
 * the Resident and Reviewer routes always observe the same case state
 * (Req 8.3, 8.4).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  AppealCase,
  CaseStore,
  CaseStatus,
  Evidence,
  EvidenceStatus,
  addEvidence as addEvidencePure,
  addFact as addFactPure,
  editFact as editFactPure,
  removeFact as removeFactPure,
  requestClarification as requestClarificationPure,
  respondClarification as respondClarificationPure,
  setDraft as setDraftPure,
  setEvidenceStatus as setEvidenceStatusPure,
  transition as transitionPure,
  FactSource,
  VerificationStatus,
} from "./case";

export interface UseCaseResult {
  activeCase: AppealCase | undefined;
  cases: AppealCase[];
  setActive: (caseId: string) => void;
  seedFromDemo: (raw: unknown) => AppealCase;
  save: (c: AppealCase) => void;
  addFact: (
    text: string,
    opts?: {
      source?: FactSource;
      verificationStatus?: VerificationStatus;
      id?: string;
    }
  ) => void;
  editFact: (id: string, text: string) => void;
  removeFact: (id: string) => void;
  addEvidence: (ev: Evidence) => void;
  setEvidenceStatus: (index: number, status: EvidenceStatus) => void;
  setDraft: (draft: string) => void;
  setStatus: (to: CaseStatus) => void;
  requestClarification: (text: string) => void;
  respondClarification: (text: string) => void;
}

export function useCase(): UseCaseResult {
  const [, forceRender] = useState(0);
  const rerender = useCallback(() => forceRender((n) => n + 1), []);
  const activeRef = useRef<AppealCase | undefined>(undefined);

  useEffect(() => {
    const onChange = () => rerender();
    const onStorage = () => {
      CaseStore.invalidate();
      rerender();
    };
    const onFocus = () => {
      CaseStore.invalidate();
      rerender();
    };

    const unsubscribe = CaseStore.subscribe(onChange);
    window.addEventListener("storage", onStorage);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);

    // Initial read after mount (store may have been hydrated elsewhere).
    CaseStore.invalidate();
    rerender();

    return () => {
      unsubscribe();
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [rerender]);

  const activeCase = CaseStore.getActive();
  activeRef.current = activeCase;

  const cases = Object.values(CaseStore.loadAll());

  const withActive = useCallback(
    (fn: (c: AppealCase) => AppealCase) => {
      const current = CaseStore.getActive();
      if (!current) return;
      const next = fn(current);
      CaseStore.save(next);
    },
    []
  );

  return {
    activeCase,
    cases,
    setActive: (caseId) => CaseStore.setActive(caseId),
    seedFromDemo: (raw) => CaseStore.seedFromDemo(raw),
    save: (c) => CaseStore.save(c),
    addFact: (text, opts) => withActive((c) => addFactPure(c, text, opts)),
    editFact: (id, text) => withActive((c) => editFactPure(c, id, text)),
    removeFact: (id) => withActive((c) => removeFactPure(c, id)),
    addEvidence: (ev) => withActive((c) => addEvidencePure(c, ev)),
    setEvidenceStatus: (index, status) =>
      withActive((c) => setEvidenceStatusPure(c, index, status)),
    setDraft: (draft) => withActive((c) => setDraftPure(c, draft)),
    setStatus: (to) => withActive((c) => transitionPure(c, to)),
    requestClarification: (text) =>
      withActive((c) => requestClarificationPure(c, text)),
    respondClarification: (text) =>
      withActive((c) => respondClarificationPure(c, text)),
  };
}
