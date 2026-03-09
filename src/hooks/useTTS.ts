import { useState, useCallback, useRef, useEffect } from "react";

export function useTTS() {
  const [muted, setMuted] = useState(false);
  const hasInteracted = useRef(false);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  // Track first user interaction for autoplay policy
  useEffect(() => {
    const handler = () => { hasInteracted.current = true; };
    window.addEventListener("click", handler, { once: true });
    window.addEventListener("touchstart", handler, { once: true });
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("touchstart", handler);
    };
  }, []);

  const getPreferredVoice = useCallback(() => {
    const voices = window.speechSynthesis.getVoices();
    const preferred = ["Daniel", "Karen", "Samantha"];
    for (const name of preferred) {
      const match = voices.find((v) => v.name.includes(name) && v.lang.startsWith("en"));
      if (match) return match;
    }
    return voices.find((v) => v.lang.startsWith("en-US")) || voices.find((v) => v.lang.startsWith("en")) || null;
  }, []);

  const speak = useCallback((word: string) => {
    if (muted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.85;
    const voice = getPreferredVoice();
    if (voice) utterance.voice = voice;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [muted, getPreferredVoice]);

  const speakIfInteracted = useCallback((word: string) => {
    if (hasInteracted.current) {
      speak(word);
    }
  }, [speak]);

  const toggleMute = useCallback(() => {
    setMuted((m) => {
      if (!m) window.speechSynthesis?.cancel();
      return !m;
    });
  }, []);

  return { muted, speak, speakIfInteracted, toggleMute };
}
