"use client";

/**
 * Optional voice input (SpeechRecognition) and output (speechSynthesis),
 * both feature-detected with graceful fallbacks (Req 12). Neither is required
 * for the core flow; controls simply hide when unsupported.
 */

import { useEffect, useRef, useState } from "react";
import { SPEECH_LANG } from "@/lib/translations";
import { useLang } from "./LangContext";

type SpeechRecognitionLike = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as Record<string, unknown>;
  return (w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null) as
    | (new () => SpeechRecognitionLike)
    | null;
}

export function MicButton({
  onTranscript,
}: {
  onTranscript: (text: string) => void;
}) {
  const { lang, t } = useLang();
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(getRecognitionCtor() !== null);
  }, []);

  if (!supported) {
    return (
      <span className="text-xs text-slate-500">{t("ui.micUnsupported")}</span>
    );
  }

  const toggle = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    const rec = new Ctor();
    rec.lang = SPEECH_LANG[lang];
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e) => {
      const transcript = e.results?.[0]?.[0]?.transcript ?? "";
      if (transcript) onTranscript(transcript);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    setListening(true);
    // Calling start() triggers the browser microphone permission prompt.
    rec.start();
  };

  return (
    <button
      type="button"
      onClick={toggle}
      aria-pressed={listening}
      className={[
        "rounded-md px-3 py-1.5 text-sm font-medium ring-1",
        listening
          ? "bg-red-600 text-white ring-red-600"
          : "bg-white text-slate-700 ring-slate-300 hover:bg-slate-100",
      ].join(" ")}
    >
      🎤 {listening ? t("ui.micStop") : t("ui.mic")}
    </button>
  );
}

export function ReadAloudButton({ text }: { text: string }) {
  const { lang, t } = useLang();
  const [supported, setSupported] = useState(false);

  useEffect(() => {
    setSupported(
      typeof window !== "undefined" && "speechSynthesis" in window
    );
  }, []);

  if (!supported) return null;

  const speak = () => {
    try {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = SPEECH_LANG[lang];
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    } catch {
      /* ignore */
    }
  };

  return (
    <button
      type="button"
      onClick={speak}
      className="rounded-md bg-white px-3 py-1.5 text-sm font-medium text-slate-700 ring-1 ring-slate-300 hover:bg-slate-100"
    >
      🔊 {t("ui.readAloud")}
    </button>
  );
}
