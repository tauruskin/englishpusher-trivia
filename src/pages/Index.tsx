import { useState, useRef, useEffect } from "react";
import { useGame } from "@/hooks/useGame";
import { useTTS } from "@/hooks/useTTS";
import { WordEntry } from "@/data/wordList";
import topics, { Topic } from "@/data/topics";
import ProgressBar from "@/components/ProgressBar";
import ScoreBadge from "@/components/ScoreBadge";
import QuestionCard from "@/components/QuestionCard";
import TrueFalseCard from "@/components/TrueFalseCard";
import MatchingCard from "@/components/MatchingCard";
import EndScreen from "@/components/EndScreen";

const Index = () => {
  const getInitialTopic = () => {
    const params = new URLSearchParams(window.location.search);
    const topicId = params.get("topic");
    return topics.find((t) => t.id === topicId) ?? topics[0];
  };
const [selectedTopic, setSelectedTopic] = useState<Topic>(getInitialTopic);
  const [customPool, setCustomPool] = useState<WordEntry[]>(topics[0].wordList);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const game = useGame(selectedTopic.wordList, selectedTopic.id);
  const tts = useTTS();

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSelectTopic = (topic: Topic) => {
      setSelectedTopic(topic);
      setDropdownOpen(false);
      window.history.pushState({}, "", `?topic=${topic.id}`);
    };

  const handlePracticeWeak = (words: WordEntry[]) => {
    setCustomPool(words);
    game.restart(words);
  };

  const handlePlayAgain = () => {
    setCustomPool(selectedTopic.wordList);
    game.restart(selectedTopic.wordList);
  };

  const renderQuestion = () => {
    if (!game.displayedQuestion) return null;
    const onSubmit = game.isReviewing ? () => {} : game.submitAnswer;

    if (game.displayedQuestion.type === "true-false") {
      return (
        <TrueFalseCard
          key={game.viewIndex}
          question={game.displayedQuestion}
          answered={game.displayedAnswered}
          selectedAnswer={game.displayedSelectedAnswer}
          isCorrect={game.displayedIsCorrect}
          streak={game.isReviewing ? 0 : game.streak}
          transitioning={game.transitioning}
          onSubmit={onSubmit}
          speak={tts.speak}
          speakIfInteracted={tts.speakIfInteracted}
        />
      );
    }

    if (game.displayedQuestion.type === "matching") {
      return (
        <MatchingCard
          key={game.viewIndex}
          question={game.displayedQuestion}
          transitioning={game.transitioning}
          onSubmit={onSubmit}
          speak={tts.speak}
          speakIfInteracted={tts.speakIfInteracted}
        />
      );
    }

    return (
      <QuestionCard
        key={game.viewIndex}
        question={game.displayedQuestion}
        answered={game.displayedAnswered}
        selectedAnswer={game.displayedSelectedAnswer}
        isCorrect={game.displayedIsCorrect}
        streak={game.isReviewing ? 0 : game.streak}
        transitioning={game.transitioning}
        onSubmit={onSubmit}
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
            <a href="https://www.englishpusher.in.ua/" target="_blank" rel="noopener noreferrer">
              <img
                src={`${import.meta.env.BASE_URL}logo.png`}
                alt="Englishpusher Logo"
                className="h-10 w-auto"
              />
            </a>
            <div className="relative" ref={dropdownRef}>
              <h1
                className="font-display text-lg font-bold text-foreground tracking-tight cursor-pointer flex items-center gap-1"
                onClick={() => setDropdownOpen((o) => !o)}
              >
                Englishpusher<span className="text-primary"> Trivia</span>
                <span className="text-xs text-muted-foreground ml-1">▼</span>
              </h1>
              <p className="text-xs text-muted-foreground">
                {selectedTopic.name}
              </p>
              {dropdownOpen && (
                <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-lg shadow-lg py-1 min-w-[200px]">
                  {topics.map((topic) => (
                    <button
                      key={topic.id}
                      onClick={() => handleSelectTopic(topic)}
                      className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-muted ${
                        topic.id === selectedTopic.id
                          ? "text-primary font-semibold bg-primary/10"
                          : "text-foreground"
                      }`}
                    >
                      {topic.name}
                    </button>
                  ))}
                </div>
              )}
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
              <button
                onClick={handlePlayAgain}
                className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-lg"
                aria-label="Restart game"
                title="Restart"
              >
                🔄
              </button>
            )}
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
        <div key={selectedTopic.id} className="w-full max-w-2xl space-y-8">
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
              {game.totalQuestions === 0 ? (
                <div className="text-center text-muted-foreground">Loading...</div>
              ) : (
                <>
                  {renderQuestion()}
                  {(game.canGoPrev || game.canGoNext) && (
                    <div className="flex justify-between items-center px-1">
                      <button
                        onClick={game.goPrev}
                        disabled={!game.canGoPrev}
                        className={game.canGoPrev
                          ? "px-4 py-2 rounded-xl border-2 border-border text-sm font-semibold hover:border-primary hover:text-primary transition-all"
                          : "px-4 py-2 rounded-xl border-2 border-transparent text-transparent cursor-default text-sm"
                        }
                      >
                        ← Back
                      </button>
                      <button
                        onClick={game.goNext}
                        disabled={!game.canGoNext}
                        className={game.canGoNext
                          ? "px-4 py-2 rounded-xl border-2 border-primary bg-primary/10 text-primary text-sm font-semibold hover:bg-primary hover:text-white transition-all"
                          : "px-4 py-2 rounded-xl border-2 border-transparent text-transparent cursor-default text-sm"
                        }
                      >
                        {game.isReviewing ? "Next →" : "Skip →"}
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>

      <footer className="border-t border-border px-6 py-4 bg-card">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>Copyright © 2026 — Developed by Tetiana Pushkar</p>
          <a
            href="https://www.englishpusher.in.ua/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary transition-colors"
          >
            Visit Englishpusher.in.ua →
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Index;
