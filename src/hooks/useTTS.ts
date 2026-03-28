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

  const audioCtxRef = useRef<AudioContext | null>(null);

  const getAudioCtx = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === "closed") {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const playTone = useCallback((
    freq: number,
    startOffset: number,
    duration: number,
    type: OscillatorType = "sine",
    volume = 0.25,
  ) => {
    const ctx = getAudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(volume, ctx.currentTime + startOffset);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + startOffset + duration);
    osc.start(ctx.currentTime + startOffset);
    osc.stop(ctx.currentTime + startOffset + duration);
  }, [getAudioCtx]);

  const playCorrect = useCallback(() => {
    if (muted || !hasInteracted.current) return;
    playTone(523.25, 0,    0.12); // C5
    playTone(659.25, 0.13, 0.22); // E5
  }, [muted, playTone]);

  const playWrong = useCallback(() => {
    if (muted || !hasInteracted.current) return;
    playTone(220, 0,    0.15, "sawtooth", 0.15);
    playTone(180, 0.12, 0.25, "sawtooth", 0.12);
  }, [muted, playTone]);

  return { muted, speak, speakIfInteracted, toggleMute, playCorrect, playWrong };
}
