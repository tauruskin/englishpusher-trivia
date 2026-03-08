import { useGame } from "@/hooks/useGame";
import ProgressBar from "@/components/ProgressBar";
import ScoreBadge from "@/components/ScoreBadge";
import QuestionCard from "@/components/QuestionCard";
import EndScreen from "@/components/EndScreen";

const Index = () => {
  const game = useGame(10);

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
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
              <p className="text-xs text-muted-foreground">Adjectives for Feelings</p>
            </div>
          </div>
          {!game.gameOver && <ScoreBadge score={game.score} total={game.currentIndex + (game.answered ? 1 : 0)} />}
        </div>
      </header>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 py-10">
        <div className="w-full max-w-2xl space-y-8">
          {game.gameOver ? (
            <EndScreen score={game.score} total={game.totalQuestions} onRestart={game.restart} />
          ) : (
            <>
              <ProgressBar current={game.currentIndex} total={game.totalQuestions} />
              {game.currentQuestion && (
                <QuestionCard
                  key={game.currentIndex}
                  question={game.currentQuestion}
                  answered={game.answered}
                  selectedAnswer={game.selectedAnswer}
                  isCorrect={game.isCorrect}
                  onSubmit={game.submitAnswer}
                />
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default Index;
