import { useState, useEffect, useRef } from "react";
import { motion } from "motion/react";
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
import MenuVertical from "@/components/ui/menu-vertical";
import GameCharacter from "@/components/GameCharacter";

const Index = () => {
  const getInitialState = () => {
    const params = new URLSearchParams(window.location.search);
    const topicId = params.get("topic");
    const found = topics.find((t) => t.id === topicId);
    return { topic: found ?? topics[0], showLanding: !found };
  };

  const initial = getInitialState();
  const [selectedTopic, setSelectedTopic] = useState<Topic>(initial.topic);
  const [showLanding, setShowLanding] = useState(initial.showLanding);
  const [customPool, setCustomPool] = useState<WordEntry[]>(initial.topic.wordList);
  const game = useGame(selectedTopic.wordList, selectedTopic.id);
  const tts = useTTS();

  const prevAnsweredRef = useRef(false);
  useEffect(() => {
    if (game.answered && !prevAnsweredRef.current && game.isCorrect !== null) {
      if (game.isCorrect) tts.playCorrect();
      else tts.playWrong();
    }
    prevAnsweredRef.current = game.answered;
  }, [game.answered, game.isCorrect, tts.playCorrect, tts.playWrong]);

  const handleSelectTopic = (topic: Topic) => {
    setSelectedTopic(topic);
    setShowLanding(false);
    setCustomPool(topic.wordList);
    window.history.pushState({}, "", `?topic=${topic.id}`);
    game.restart(topic.wordList);
  };

  const handleGoToLanding = () => {
    setShowLanding(true);
    window.history.pushState({}, "", window.location.pathname);
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
          isReview={game.isReviewing}
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
          isReview={game.isReviewing}
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
        isReview={game.isReviewing}
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
            <div>
              <h1
                className="font-display text-lg font-bold text-foreground tracking-tight flex items-center gap-1 cursor-pointer"
                onClick={showLanding ? undefined : handleGoToLanding}
                title={showLanding ? undefined : "Back to topics"}
              >
                Englishpusher<span className="text-primary"> Trivia</span>
              </h1>
              {!showLanding && (
                <p className="text-xs text-muted-foreground">{selectedTopic.name}</p>
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
            {!showLanding && !game.gameOver && (
              <>
                <button
                  onClick={handlePlayAgain}
                  className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-muted transition-colors text-lg"
                  aria-label="Restart game"
                  title="Restart"
                >
                  🔄
                </button>
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
        {showLanding ? (
          <motion.div
            key="landing"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35 }}
            className="w-full max-w-4xl flex items-center gap-10"
          >
            {/* Teacher + speech bubble — desktop only */}
            <div className="hidden md:flex flex-col items-center gap-4 flex-shrink-0">
              <motion.div
                className="relative bg-card border-2 border-border rounded-2xl px-5 py-3 shadow-sm max-w-[200px] text-center"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, type: "spring", stiffness: 260, damping: 20 }}
              >
                <p className="font-body text-sm text-foreground leading-snug">
                  What shall we practise today? 😊
                </p>
                {/* Bubble tail pointing down */}
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-[10px] w-0 h-0 border-l-[10px] border-l-transparent border-r-[10px] border-r-transparent border-t-[10px] border-t-border" />
                <div className="absolute left-1/2 -translate-x-1/2 -bottom-[8px] w-0 h-0 border-l-[9px] border-l-transparent border-r-[9px] border-r-transparent border-t-[9px] border-t-card" />
              </motion.div>
              <GameCharacter pose="idle" className="w-[180px]" />
            </div>

            {/* Topic menu */}
            <div className="flex-1">
              <MenuVertical
                title="Choose a Topic"
                subtitle="Pick a topic to start practising"
                items={topics.map((t) => ({
                  label: t.name,
                  description: `${t.wordList.length} words`,
                  onClick: () => handleSelectTopic(t),
                }))}
              />
            </div>
          </motion.div>
        ) : (
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
        )}
      </main>

      <footer className="border-t border-border px-6 py-4 bg-card">
        <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-muted-foreground">
          <p>Copyright © 2026 — Developed by Tetiana Pushkar</p>
          <div className="flex items-center gap-4">
            <a
              href="https://app.englishpusher.in.ua/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              ← All Apps
            </a>
            <a
              href="https://www.englishpusher.in.ua/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-primary transition-colors"
            >
              Visit Englishpusher.in.ua →
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
