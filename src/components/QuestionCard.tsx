import { useState, useEffect } from "react";
import { Question } from "@/hooks/useGame";
import GameCharacter, { CharacterPose } from "@/components/GameCharacter";
import SpeakerButton from "@/components/SpeakerButton";

interface QuestionCardProps {
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

const QuestionCard = ({ question, answered, selectedAnswer, isCorrect, streak, transitioning, onSubmit, speak, speakIfInteracted }: QuestionCardProps) => {
  const [inputValue, setInputValue] = useState("");

  // Auto-pronounce only when English word is the displayed question
  useEffect(() => {
    if (question.type === "en-to-native") {
      const timer = setTimeout(() => speakIfInteracted(question.word.word), 500);
      return () => clearTimeout(timer);
    }
    // Do NOT auto-pronounce for sentence-completion
  }, [question.word.word, question.type, speakIfInteracted]);

  const getPrompt = () => {
    switch (question.type) {
      case "en-to-native": return "What does this word mean?";
      case "native-to-en": return "Which English word matches?";
      case "type-word": return "Type the English word:";
      case "sentence-completion": return "Fill in the missing word:";
    }
  };

  const getDisplayWord = () => {
    switch (question.type) {
      case "en-to-native": return question.word.word;
      case "native-to-en": return question.word.translation;
      case "type-word": return question.word.translation;
      case "sentence-completion": return null; // sentence is shown instead
    }
  };

  const isSentenceCompletion = question.type === "sentence-completion";

  const getOptionStyle = (option: string) => {
    if (!answered) return "bg-secondary hover:bg-muted border-border hover:border-primary/50 text-foreground hover:scale-[1.02] active:scale-[0.98]";
    if (option === question.correctAnswer) return "bg-success/20 border-success text-success animate-bounce-once";
    if (option === selectedAnswer && !isCorrect) return "bg-destructive/20 border-destructive text-destructive animate-shake";
    return "bg-secondary border-border text-muted-foreground opacity-50";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim() && !answered) {
      onSubmit(inputValue.trim());
    }
  };

  const handleSubmitTypeWord = () => {
    if (inputValue.trim() && !answered) {
      onSubmit(inputValue.trim());
    }
  };

  const characterPose: CharacterPose = !answered ? "thinking" : isCorrect ? "happy" : "sad";

  const showSpeakerInline = question.type === "en-to-native";
  const showSpeakerForAnswer = question.type === "native-to-en" || question.type === "type-word";

  return (
    <div className="flex items-center gap-6 w-full">
      <GameCharacter pose={characterPose} className="flex-shrink-0" />
      <div className={`flex-1 w-full max-w-lg mx-auto space-y-6 bg-card rounded-2xl p-8 border border-border shadow-md relative overflow-hidden transition-all duration-300 ${transitioning ? 'opacity-0 translate-y-4' : 'opacity-100 translate-y-0 animate-slide-up'}`}>
      {/* Reaction emoji overlay */}
      {answered && isCorrect !== null && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
          <span className={`text-7xl ${isCorrect ? 'animate-emoji-correct' : 'animate-emoji-wrong'}`}>
            {isCorrect ? '🎉' : '😬'}
          </span>
        </div>
      )}

      {/* Streak badge */}
      {streak >= 2 && (
        <div className={`absolute -top-1 -right-1 bg-primary text-primary-foreground px-3 py-1 rounded-bl-xl rounded-tr-2xl font-display text-sm font-bold ${streak >= 3 ? 'animate-pulse' : ''}`}>
          🔥 {streak} in a row!
        </div>
      )}

      {/* Type label */}
      <div className="flex justify-center">
        <span className="text-xs uppercase tracking-widest text-accent font-display font-semibold">
          {isSentenceCompletion ? "Complete the Sentence" : question.type === "type-word" ? "Type the Word" : "Multiple Choice"}
        </span>
      </div>

      {/* Prompt */}
      <p className="text-muted-foreground text-center text-sm">{getPrompt()}</p>

      {/* Main word or sentence */}
      <div className="text-center">
        {isSentenceCompletion && question.sentence ? (
          <p className="font-body text-lg md:text-xl text-foreground leading-relaxed">
            {question.sentence.split("___").map((part, idx, arr) => (
              <span key={idx}>
                {part}
                {idx < arr.length - 1 && (
                  <span className="inline-block mx-1 border-b-2 border-primary min-w-[80px] text-center font-bold text-primary">
                    {answered ? question.correctAnswer : "___"}
                  </span>
                )}
              </span>
            ))}
          </p>
        ) : (
          <div className="flex items-center justify-center gap-1">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-relaxed">
              {getDisplayWord()}
            </h2>
            {showSpeakerInline && (
              <SpeakerButton word={question.word.word} onSpeak={speak} />
            )}
            {showSpeakerForAnswer && (
              <SpeakerButton word={question.correctAnswer} onSpeak={speak} />
            )}
          </div>
        )}
      </div>

      {/* Options or Input */}
      {question.type === "type-word" ? (
        <div className="space-y-3">
          {!answered ? (
            <>
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type the English word..."
                className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-body"
                autoFocus
              />
              <button
                onClick={handleSubmitTypeWord}
                className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Submit
              </button>
            </>
          ) : (
            <div className="text-center space-y-2">
              {isCorrect ? (
                <p className="text-lg font-bold text-success animate-bounce-once">
                  ✅ {question.correctAnswer}
                </p>
              ) : (
                <>
                  <p className="text-lg font-bold text-destructive animate-shake">
                    ❌ {selectedAnswer}
                  </p>
                  <p className="text-lg font-bold text-success">
                    Correct: {question.correctAnswer}
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {question.options!.map((option, i) => (
            <button
              key={option}
              onClick={() => !answered && onSubmit(option)}
              disabled={answered}
              style={{ animationDelay: `${i * 50}ms` }}
              className={`w-full text-left px-5 py-3.5 rounded-lg border-2 font-body transition-all duration-200 ${getOptionStyle(option)}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
      </div>
    </div>
  );
};

export default QuestionCard;
