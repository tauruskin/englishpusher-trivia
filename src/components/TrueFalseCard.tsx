import { useEffect } from "react";
import { Question } from "@/hooks/useGame";
import GameCharacter, { CharacterPose } from "@/components/GameCharacter";
import SpeakerButton from "@/components/SpeakerButton";
import { BorderRotate } from "@/components/ui/animated-gradient-border";

interface TrueFalseCardProps {
  isReview?: boolean;
  question: Question;
  answered: boolean;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  streak: number;
  transitioning: boolean;
  onSubmit: (answer: string) => void;
  speak: (word: string) => void;
  speakIfInteracted: (word: string) => void;
}

const TrueFalseCard = ({
  question,
  answered,
  selectedAnswer,
  isCorrect,
  streak,
  isReview,
  transitioning,
  onSubmit,
  speak,
  speakIfInteracted,
}: TrueFalseCardProps) => {
  const characterPose: CharacterPose = !answered ? "thinking" : isCorrect ? "happy" : "sad";

  // Auto-pronounce: English word is shown as the question
  useEffect(() => {
    const timer = setTimeout(() => speakIfInteracted(question.word.word), 500);
    return () => clearTimeout(timer);
  }, [question.word.word, speakIfInteracted]);

  const getBtnStyle = (value: string) => {
    if (!answered) {
      return "bg-secondary hover:bg-muted border-border hover:border-primary/50 text-foreground hover:scale-[1.02] active:scale-[0.98]";
    }
    if (value === question.correctAnswer) {
      return "bg-success/20 border-success text-success animate-bounce-once";
    }
    if (value === selectedAnswer && !isCorrect) {
      return "bg-destructive/20 border-destructive text-destructive animate-shake";
    }
    return "bg-secondary border-border text-muted-foreground opacity-50";
  };

  return (
    <div className="flex items-center gap-6 w-full">
      <GameCharacter pose={characterPose} className="flex-shrink-0" />
      <BorderRotate
        animationSpeed={answered ? (isCorrect ? 1.5 : 4) : 6}
        gradientColors={
          answered
            ? isCorrect
              ? { primary: '#1a7040', secondary: '#34b268', accent: '#7dd4a0' }
              : { primary: '#8b1a1a', secondary: '#d54242', accent: '#e88888' }
            : { primary: '#c06010', secondary: '#f07c1a', accent: '#fcc870' }
        }
        backgroundColor="#ffffff"
        className={`flex-1 w-full max-w-lg mx-auto space-y-6 rounded-2xl p-8 shadow-md relative overflow-hidden transition-all duration-300 ${
          transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0 animate-slide-up"
        }`}
      >
        {/* Reaction emoji */}
        {answered && isCorrect !== null && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className={`text-7xl ${isCorrect ? "animate-emoji-correct" : "animate-emoji-wrong"}`}>
              {isCorrect ? "🎉" : "😬"}
            </span>
          </div>
        )}

        {/* Reviewing / Streak badge */}
        {isReview ? (
          <div className="absolute -top-1 -right-1 !mt-0 bg-muted text-muted-foreground px-3 py-1 rounded-bl-xl rounded-tr-2xl text-xs font-bold">
            ← Reviewing
          </div>
        ) : streak >= 2 && (
          <div
            className={`absolute -top-1 -right-1 !mt-0 bg-primary text-primary-foreground px-3 py-1 rounded-bl-xl rounded-tr-2xl font-display text-sm font-bold ${
              streak >= 3 ? "animate-pulse" : ""
            }`}
          >
            🔥 {streak} in a row!
          </div>
        )}

        {/* Type label */}
        <div className="flex justify-center">
          <span className="text-base uppercase tracking-widest text-accent font-display font-semibold">
            True or False
          </span>
        </div>

        {/* Prompt */}
        <p className="text-muted-foreground text-center text-sm">
          Does this translation match the word?
        </p>

        {/* English word */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-1">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">
              {question.word.word}
            </h2>
            <SpeakerButton word={question.word.word} onSpeak={speak} />
          </div>
          <p className="text-lg text-muted-foreground mt-2">= {question.shownTranslation}</p>
        </div>

        {/* True / False buttons */}
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => !answered && onSubmit("true")}
            disabled={answered}
            className={`w-full px-5 py-4 rounded-lg border-2 font-display font-bold text-lg transition-all duration-200 ${getBtnStyle("true")}`}
          >
            ✅ True
          </button>
          <button
            onClick={() => !answered && onSubmit("false")}
            disabled={answered}
            className={`w-full px-5 py-4 rounded-lg border-2 font-display font-bold text-lg transition-all duration-200 ${getBtnStyle("false")}`}
          >
            ❌ False
          </button>
        </div>
      </BorderRotate>
    </div>
  );
};

export default TrueFalseCard;
