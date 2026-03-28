import { useState, useCallback, useEffect, useRef } from "react";
import { WordEntry } from "@/data/wordList";

export type QuestionType = "en-to-native" | "native-to-en" | "type-word" | "true-false" | "matching" | "sentence-completion";

export interface Question {
  type: QuestionType;
  word: WordEntry;
  words?: WordEntry[];
  options?: string[];
  correctAnswer: string;
  shownTranslation?: string;
  sentence?: string;
}

export interface AnswerResult {
  word: WordEntry;
  questionType: QuestionType;
  correct: boolean;
}

const configToType: Record<string, QuestionType> = {
  multipleChoice: "en-to-native",
  reversed: "native-to-en",
  typeTheWord: "type-word",
  trueOrFalse: "true-false",
  matching: "matching",
  sentenceCompletion: "sentence-completion",
};

export const questionTypeLabel: Record<QuestionType, string> = {
  "en-to-native": "Multiple choice",
  "native-to-en": "Reverse multiple choice",
  "type-word": "Type the word",
  "true-false": "True or False",
  "matching": "Match the pair",
  "sentence-completion": "Complete the sentence",
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function buildSingleQuestion(word: WordEntry, type: QuestionType, pool: WordEntry[]): Question {
  if (type === "type-word") {
    return { type, word, correctAnswer: word.word };
  }

  if (type === "true-false") {
    const isTrue = Math.random() < 0.5;
    const shownTranslation = isTrue
      ? word.translation
      : shuffle(pool.filter((w) => w.word !== word.word))[0].translation;
    return { type, word, correctAnswer: isTrue ? "true" : "false", shownTranslation };
  }

  if (type === "sentence-completion") {
    const others = pool.filter((w) => w.word !== word.word);
    const wrongOnes = shuffle(others).slice(0, 3);
    const options = shuffle([word.word, ...wrongOnes.map((w) => w.word)]);
    return { type, word, options, correctAnswer: word.word, sentence: word.example };
  }

  const others = pool.filter((w) => w.word !== word.word);
  const wrongOnes = shuffle(others).slice(0, 3);

  if (type === "en-to-native") {
    const options = shuffle([word.translation, ...wrongOnes.map((w) => w.translation)]);
    return { type, word, options, correctAnswer: word.translation };
  } else {
    const options = shuffle([word.word, ...wrongOnes.map((w) => w.word)]);
    return { type, word, options, correctAnswer: word.word };
  }
}

function generateQuestions(pool: WordEntry[]): Question[] {
  const shuffled = shuffle(pool);
  const questions: Question[] = [];

  // Calculate how many matching cards (10% of words, in groups of 5)
  const matchingWordCount = Math.max(5, Math.round(pool.length * 0.25 / 5) * 5);
  const matchingWords = shuffled.slice(0, matchingWordCount);
  const remaining = shuffled.slice(matchingWordCount);

  // Create matching cards (1 card per 5 words)
  for (let i = 0; i < matchingWords.length; i += 5) {
    const group = matchingWords.slice(i, i + 5);
    questions.push({
      type: "matching",
      word: group[0],
      words: group,
      correctAnswer: "matched",
    });
  }

  // Divide remaining words into 4 equal zones
  const zoneSize = Math.ceil(remaining.length / 4);
  remaining.forEach((word, idx) => {
    const zone = Math.floor(idx / zoneSize);
    let type: QuestionType;
    if (zone === 0) type = "en-to-native";
    else if (zone === 1) type = "true-false";
    else if (zone === 2) type = "type-word";
    else type = word.example ? "sentence-completion" : "en-to-native";
    questions.push(buildSingleQuestion(word, type, pool));
  });

  return questions;
}

export function useGame(pool: WordEntry[], topicId?: string) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [viewIndex, setViewIndex] = useState(0);
  const viewIndexRef = useRef(0);
  const pendingAdvanceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>([]);
  const [resultsMap, setResultsMap] = useState<Record<number, { userAnswer: string; isCorrect: boolean }>>({});
  const [gameId, setGameId] = useState(0);

  useEffect(() => {
    if (pendingAdvanceRef.current) {
      clearTimeout(pendingAdvanceRef.current);
      pendingAdvanceRef.current = null;
    }
    setQuestions(generateQuestions(pool));
    setCurrentIndex(0);
    setViewIndex(0);
    viewIndexRef.current = 0;
    setScore(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGameOver(false);
    setStreak(0);
    setTransitioning(false);
    setResults([]);
    setResultsMap({});
  }, [topicId]);

  const currentQuestion = questions[currentIndex] ?? null;

  const advanceGame = useCallback((fromIndex: number) => {
    pendingAdvanceRef.current = null;
    setTransitioning(true);
    setTimeout(() => {
      const nextIdx = fromIndex + 1;
      if (nextIdx >= questions.length) {
        setGameOver(true);
      } else {
        setCurrentIndex(nextIdx);
        if (viewIndexRef.current === fromIndex) {
          setViewIndex(nextIdx);
          viewIndexRef.current = nextIdx;
        }
      }
      setAnswered(false);
      setSelectedAnswer(null);
      setIsCorrect(null);
      setTransitioning(false);
    }, 300);
  }, [questions.length]);

  const submitAnswer = useCallback(
    (answer: string) => {
      if (answered || !currentQuestion) return;
      const correct = answer.trim().toLowerCase() === currentQuestion.correctAnswer.toLowerCase();
      setSelectedAnswer(answer);
      setIsCorrect(correct);
      setAnswered(true);
      if (correct) {
        setScore((s) => s + 1);
        setStreak((s) => s + 1);
      } else {
        setStreak(0);
      }

      // Record results for each word in the question
      if (currentQuestion.type === "matching" && currentQuestion.words) {
        setResults((prev) => [
          ...prev,
          ...currentQuestion.words!.map((w) => ({
            word: w,
            questionType: currentQuestion.type,
            correct,
          })),
        ]);
      } else {
        setResults((prev) => [
          ...prev,
          { word: currentQuestion.word, questionType: currentQuestion.type, correct },
        ]);
      }

      setResultsMap((prev) => ({ ...prev, [currentIndex]: { userAnswer: answer, isCorrect: correct } }));

      const isMatching = currentQuestion.type === "matching";
      const isTypeWord = currentQuestion.type === "type-word";
      const isSentenceCompletion = currentQuestion.type === "sentence-completion";
      const feedbackDelay = isMatching
        ? 300
        : isTypeWord
          ? correct ? 2000 : 3000
          : isSentenceCompletion
            ? correct ? 2000 : 4000
            : 1000;

      const timeout = setTimeout(() => advanceGame(currentIndex), feedbackDelay);
      pendingAdvanceRef.current = timeout;
    },
    [answered, currentQuestion, currentIndex, advanceGame]
  );

  const isReviewing = viewIndex < currentIndex;
  const canGoPrev = viewIndex > 0;
  const canGoNext = isReviewing || (answered && !gameOver);

  const goPrev = useCallback(() => {
    if (viewIndex > 0) {
      const newIdx = viewIndex - 1;
      setViewIndex(newIdx);
      viewIndexRef.current = newIdx;
    }
  }, [viewIndex]);

  const goNext = useCallback(() => {
    if (isReviewing) {
      const newIdx = viewIndex + 1;
      setViewIndex(newIdx);
      viewIndexRef.current = newIdx;
    } else {
      if (pendingAdvanceRef.current) {
        clearTimeout(pendingAdvanceRef.current);
        pendingAdvanceRef.current = null;
      }
      advanceGame(currentIndex);
    }
  }, [isReviewing, viewIndex, currentIndex, advanceGame]);

  const displayedQuestion = questions[viewIndex] ?? null;
  const displayedAnswered = isReviewing ? true : answered;
  const displayedSelectedAnswer = isReviewing ? (resultsMap[viewIndex]?.userAnswer ?? null) : selectedAnswer;
  const displayedIsCorrect = isReviewing ? (resultsMap[viewIndex]?.isCorrect ?? null) : isCorrect;

  const restart = useCallback((newPool?: WordEntry[]) => {
    if (pendingAdvanceRef.current) {
      clearTimeout(pendingAdvanceRef.current);
      pendingAdvanceRef.current = null;
    }
    const p = newPool ?? pool;
    setQuestions(generateQuestions(p));
    setCurrentIndex(0);
    setViewIndex(0);
    viewIndexRef.current = 0;
    setScore(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGameOver(false);
    setStreak(0);
    setTransitioning(false);
    setResults([]);
    setResultsMap({});
    setGameId((id) => id + 1);
  }, [pool]);

  return {
    currentQuestion,
    displayedQuestion,
    currentIndex,
    viewIndex,
    totalQuestions: questions.length,
    score,
    answered,
    selectedAnswer,
    isCorrect,
    displayedAnswered,
    displayedSelectedAnswer,
    displayedIsCorrect,
    isReviewing,
    canGoPrev,
    canGoNext,
    gameOver,
    streak,
    transitioning,
    results,
    gameId,
    submitAnswer,
    goPrev,
    goNext,
    restart,
  };
}
