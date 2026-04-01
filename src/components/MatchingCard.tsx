import { useState, useCallback, useEffect, useMemo } from "react";
import { Question } from "@/hooks/useGame";
import GameCharacter, { CharacterPose } from "@/components/GameCharacter";
import SpeakerButton from "@/components/SpeakerButton";
import { BorderRotate } from "@/components/ui/animated-gradient-border";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface MatchingCardProps {
  isReview?: boolean;
  question: Question;
  transitioning: boolean;
  onSubmit: (answer: string) => void;
  speak: (word: string) => void;
  speakIfInteracted: (word: string) => void;
}

const MatchingCard = ({ question, transitioning, onSubmit, speak, isReview }: MatchingCardProps) => {
  const words = question.words!;

  const shuffledTranslations = useMemo(() => shuffle(words.map((w) => w.translation)), [words]);
  const [correctPairs, setCorrectPairs] = useState<Set<string>>(() =>
    isReview ? new Set(words.map((w) => w.word)) : new Set()
  );
  const [selected, setSelected] = useState<string | null>(null);
  const [shaking, setShaking] = useState<{ word: string; translation: string } | null>(null);
  const [allDone, setAllDone] = useState(() => !!isReview);

  const checkMatch = useCallback(
    (englishWord: string, translation: string) => {
      if (correctPairs.has(englishWord)) return;
      const entry = words.find((w) => w.word === englishWord);
      if (entry && entry.translation === translation) {
        const next = new Set(correctPairs);
        next.add(englishWord);
        setCorrectPairs(next);
        if (next.size === words.length) setAllDone(true);
      } else {
        setShaking({ word: englishWord, translation });
        setTimeout(() => setShaking(null), 500);
      }
      setSelected(null);
    },
    [correctPairs, words]
  );

  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(() => onSubmit("matched"), 2000);
      return () => clearTimeout(timer);
    }
  }, [allDone, onSubmit]);

  const handleWordClick = (word: string) => {
    if (correctPairs.has(word) || allDone) return;
    setSelected(selected === word ? null : word);
  };

  const handleTranslationClick = (translation: string) => {
    if (allDone) return;
    const alreadyMatched = words.find((w) => correctPairs.has(w.word) && w.translation === translation);
    if (alreadyMatched) return;
    if (selected) checkMatch(selected, translation);
  };

  const characterPose: CharacterPose = allDone ? "celebrate" : "thinking";

  const getWordStyle = (word: string) => {
    if (correctPairs.has(word))
      return "bg-success/20 border-success text-success cursor-default";
    if (shaking?.word === word)
      return "bg-destructive/20 border-destructive text-destructive animate-shake cursor-pointer";
    if (selected === word)
      return "bg-orange-100 border-orange-400 text-orange-700 ring-2 ring-orange-400 cursor-pointer dark:bg-orange-900/30 dark:text-orange-300";
    return "bg-secondary border-border text-foreground cursor-pointer hover:border-primary/50 hover:scale-[1.02] active:scale-95";
  };

  const getTranslationStyle = (translation: string) => {
    const matched = words.find((w) => correctPairs.has(w.word) && w.translation === translation);
    if (matched) return "bg-success/20 border-success text-success cursor-default";
    if (shaking?.translation === translation)
      return "bg-destructive/20 border-destructive text-destructive animate-shake cursor-pointer";
    return "bg-secondary border-border text-foreground cursor-pointer hover:border-primary/50 hover:scale-[1.02] active:scale-95";
  };

  return (
    <div className="flex items-center gap-6 w-full">
      <GameCharacter pose={characterPose} className="flex-shrink-0" />
      <BorderRotate
        animationSpeed={allDone ? 1.5 : 6}
        gradientColors={
          allDone
            ? { primary: '#1a7040', secondary: '#34b268', accent: '#7dd4a0' }
            : { primary: '#c06010', secondary: '#f07c1a', accent: '#fcc870' }
        }
        backgroundColor="#ffffff"
        className={`flex-1 w-full max-w-2xl mx-auto space-y-5 rounded-2xl p-6 md:p-8 shadow-md relative overflow-hidden transition-all duration-300 ${
          transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0 animate-slide-up"
        }`}
      >
        {isReview && (
          <div className="absolute -top-1 -right-1 !mt-0 bg-muted text-muted-foreground px-3 py-1 rounded-bl-xl rounded-tr-2xl text-xs font-bold">
            ← Reviewing
          </div>
        )}
        {allDone && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-7xl animate-emoji-correct">🎉</span>
          </div>
        )}

        <div className="flex justify-center">
          <span className="text-base uppercase tracking-widest text-accent font-display font-semibold">
            Match the Pairs
          </span>
        </div>

        <p className="text-muted-foreground text-center text-sm">
          {allDone
            ? "All matched! Great job! 🎊"
            : "Click an English word, then click its Ukrainian translation"}
        </p>

        <p className="text-center text-xs text-muted-foreground">
          {correctPairs.size}/{words.length} matched
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs font-display font-semibold text-muted-foreground text-center mb-1">English</p>
            {words.map((w) => (
              <div
                key={w.word}
                onClick={() => handleWordClick(w.word)}
                className={`px-3 py-2.5 rounded-lg border-2 font-body text-sm md:text-base text-center transition-all duration-200 select-none flex items-center justify-center gap-1 ${getWordStyle(w.word)}`}
              >
                {w.word}
                {!correctPairs.has(w.word) && (
                  <SpeakerButton word={w.word} onSpeak={speak} className="w-6 h-6 text-xs" />
                )}
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <p className="text-xs font-display font-semibold text-muted-foreground text-center mb-1">Ukrainian</p>
            {shuffledTranslations.map((t) => (
              <div
                key={t}
                onClick={() => handleTranslationClick(t)}
                className={`px-3 py-2.5 rounded-lg border-2 font-body text-sm md:text-base text-center transition-all duration-200 select-none ${getTranslationStyle(t)}`}
              >
                {t}
              </div>
            ))}
          </div>
        </div>
      </BorderRotate>
    </div>
  );
};

export default MatchingCard;
