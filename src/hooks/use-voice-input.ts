import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typing for Web Speech API (vendor-prefixed in some browsers)
type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((e: any) => void) | null;
  onerror: ((e: any) => void) | null;
  onend: (() => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};

function getRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === "undefined") return null;
  const w = window as any;
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

export interface UseVoiceInputOptions {
  lang?: string;
  continuous?: boolean;
  onFinal?: (text: string) => void;
  onInterim?: (text: string) => void;
}

export function useVoiceInput(opts: UseVoiceInputOptions = {}) {
  const { lang = "en-US", continuous = false, onFinal, onInterim } = opts;
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(false);
  const [interim, setInterim] = useState("");
  const recRef = useRef<SpeechRecognitionLike | null>(null);
  const finalRef = useRef(onFinal);
  const interimRef = useRef(onInterim);

  useEffect(() => {
    finalRef.current = onFinal;
    interimRef.current = onInterim;
  }, [onFinal, onInterim]);

  useEffect(() => {
    setSupported(!!getRecognitionCtor());
  }, []);

  const stop = useCallback(() => {
    recRef.current?.stop();
  }, []);

  const start = useCallback(() => {
    const Ctor = getRecognitionCtor();
    if (!Ctor) return;
    if (recRef.current) {
      try { recRef.current.abort(); } catch {}
    }
    const rec = new Ctor();
    rec.lang = lang;
    rec.interimResults = true;
    rec.continuous = continuous;
    rec.onresult = (e: any) => {
      let finalText = "";
      let interimText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const t = r[0]?.transcript ?? "";
        if (r.isFinal) finalText += t;
        else interimText += t;
      }
      if (interimText) {
        setInterim(interimText);
        interimRef.current?.(interimText);
      }
      if (finalText) {
        setInterim("");
        finalRef.current?.(finalText.trim());
      }
    };
    rec.onerror = () => setListening(false);
    rec.onend = () => {
      setListening(false);
      setInterim("");
    };
    recRef.current = rec;
    try {
      rec.start();
      setListening(true);
    } catch {
      setListening(false);
    }
  }, [lang, continuous]);

  const toggle = useCallback(() => {
    if (listening) stop();
    else start();
  }, [listening, start, stop]);

  useEffect(() => () => { try { recRef.current?.abort(); } catch {} }, []);

  return { listening, supported, interim, start, stop, toggle };
}
