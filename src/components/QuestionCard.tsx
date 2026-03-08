import { useState } from "react";
import { Question } from "@/hooks/useGame";

interface QuestionCardProps {
  question: Question;
  answered: boolean;
  selectedAnswer: string | null;
  isCorrect: boolean | null;
  onSubmit: (answer: string) => void;
}

const QuestionCard = ({ question, answered, selectedAnswer, isCorrect, onSubmit }: QuestionCardProps) => {
  const [inputValue, setInputValue] = useState("");

  const getPrompt = () => {
    switch (question.type) {
      case "en-to-native":
        return "What does this word mean?";
      case "native-to-en":
        return "Which English word matches?";
      case "fill-blank":
        return "Fill in the blank:";
    }
  };

  const getDisplayWord = () => {
    switch (question.type) {
      case "en-to-native":
        return question.word.word;
      case "native-to-en":
        return question.word.translation;
      case "fill-blank":
        return question.word.example;
    }
  };

  const getOptionStyle = (option: string) => {
    if (!answered) return "bg-secondary hover:bg-muted border-border hover:border-primary/50 text-foreground";
    if (option === question.correctAnswer) return "bg-success/20 border-success text-success";
    if (option === selectedAnswer && !isCorrect) return "bg-destructive/20 border-destructive text-destructive";
    return "bg-secondary border-border text-muted-foreground opacity-50";
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && inputValue.trim() && !answered) {
      onSubmit(inputValue.trim());
      setInputValue("");
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto space-y-6 animate-in fade-in duration-300 bg-card rounded-2xl p-8 border border-border shadow-md">
      {/* Type label */}
      <div className="flex justify-center">
        <span className="text-xs uppercase tracking-widest text-accent font-display font-semibold">
          {question.type === "fill-blank" ? "Fill in the Blank" : "Multiple Choice"}
        </span>
      </div>

      {/* Prompt */}
      <p className="text-muted-foreground text-center text-sm">{getPrompt()}</p>

      {/* Main word/sentence */}
      <div className="text-center">
        <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground leading-relaxed">
          {getDisplayWord()}
        </h2>
      </div>

      {/* Options or Input */}
      {question.type === "fill-blank" ? (
        <div className="space-y-3">
          <input
            type="text"
            value={answered ? "" : inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={answered}
            placeholder="Type the missing word..."
            className="w-full px-4 py-3 rounded-lg bg-secondary border border-border text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary font-body disabled:opacity-50"
            autoFocus
          />
          {!answered && (
            <button
              onClick={() => { if (inputValue.trim()) { onSubmit(inputValue.trim()); setInputValue(""); } }}
              className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-display font-semibold hover:opacity-90 transition-opacity"
            >
              Submit
            </button>
          )}
          {answered && (
            <div className={`text-center py-3 rounded-lg font-display font-semibold ${isCorrect ? "text-success" : "text-destructive"}`}>
              {isCorrect ? "Correct! ✓" : `Wrong — the answer is "${question.correctAnswer}"`}
            </div>
          )}
        </div>
      ) : (
        <div className="grid gap-3">
          {question.options!.map((option) => (
            <button
              key={option}
              onClick={() => !answered && onSubmit(option)}
              disabled={answered}
              className={`w-full text-left px-5 py-3.5 rounded-lg border-2 font-body transition-all duration-200 ${getOptionStyle(option)}`}
            >
              {option}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionCard;
