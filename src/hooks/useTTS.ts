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

  const speak = useCallback((word: string) => {
    if (muted || !window.speechSynthesis) return;
    // Cancel any ongoing speech
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = "en-US";
    utterance.rate = 0.9;
    utteranceRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  }, [muted]);

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
