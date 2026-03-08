import { useState } from "react";
import { useGame } from "@/hooks/useGame";
import { useTTS } from "@/hooks/useTTS";
import { WordEntry } from "@/data/wordList";
import ProgressBar from "@/components/ProgressBar";
import ScoreBadge from "@/components/ScoreBadge";
import QuestionCard from "@/components/QuestionCard";
import TrueFalseCard from "@/components/TrueFalseCard";
import MatchingCard from "@/components/MatchingCard";
import EndScreen from "@/components/EndScreen";

const Index = () => {
  const [customPool, setCustomPool] = useState<WordEntry[] | undefined>();
  const game = useGame(customPool);
  const tts = useTTS();

  const handlePracticeWeak = (words: WordEntry[]) => {
    setCustomPool(words);
    game.restart(words);
  };

  const handlePlayAgain = () => {
    setCustomPool(undefined);
    game.restart();
  };

  const renderQuestion = () => {
    if (!game.currentQuestion) return null;

    if (game.currentQuestion.type === "true-false") {
      return (
        <TrueFalseCard
          key={game.currentIndex}
          question={game.currentQuestion}
          answered={game.answered}
          selectedAnswer={game.selectedAnswer}
          isCorrect={game.isCorrect}
          streak={game.streak}
          transitioning={game.transitioning}
          onSubmit={game.submitAnswer}
          speak={tts.speak}
          speakIfInteracted={tts.speakIfInteracted}
        />
      );
    }

    if (game.currentQuestion.type === "matching") {
      return (
        <MatchingCard
          key={game.currentIndex}
          question={game.currentQuestion}
          transitioning={game.transitioning}
          onSubmit={game.submitAnswer}
          speak={tts.speak}
          speakIfInteracted={tts.speakIfInteracted}
        />
      );
    }

    return (
      <QuestionCard
        key={game.currentIndex}
        question={game.currentQuestion}
        answered={game.answered}
        selectedAnswer={game.selectedAnswer}
        isCorrect={game.isCorrect}
        streak={game.streak}
        transitioning={game.transitioning}
        onSubmit={game.submitAnswer}
        speak={tts.speak}
        speakIfInteracted={tts.speakIfInteracted}
      />
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border px-6 py-4 bg-card shadow-sm">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="EnglishPusher Logo"
              className="h-10 w-auto"
            />
            <div>
              <h1 className="font-display text-lg font-bold text-foreground tracking-tight">
                EnglishPusher<span className="text-primary"> Trivia</span>
              </h1>
              <p className="text-xs text-muted-foreground">Test your English vocabulary! 🚀</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={tts.toggleMute}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-lg"
              aria-label={tts.muted ? "Unmute pronunciation" : "Mute pronunciation"}
              title={tts.muted ? "Unmute" : "Mute"}
            >
              {tts.muted ? "🔇" : "🔊"}
            </button>
            {!game.gameOver && (
              <>
                {game.streak >= 3 && (
                  <span className="text-sm font-display font-bold text-primary animate-pulse">
                    🔥 {game.streak}
                  </span>
                )}
                <ScoreBadge score={game.score} total={game.currentIndex + (game.answered ? 1 : 0)} />
              </>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl space-y-8">
          {game.gameOver ? (
            <EndScreen
              score={game.score}
              total={game.totalQuestions}
              results={game.results}
              onRestart={handlePlayAgain}
              onPracticeWeak={handlePracticeWeak}
            />
          ) : (
            <>
              <ProgressBar current={game.currentIndex} total={game.totalQuestions} />
              {renderQuestion()}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
