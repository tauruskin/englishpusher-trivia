import { useState, useCallback, useEffect } from "react";
import wordList, { WordEntry, enabledQuestionTypes } from "@/data/wordList";

const STORAGE_KEY = "englishpusher-game-progress";

interface SavedProgress {
  questions: Question[];
  currentIndex: number;
  score: number;
  streak: number;
  results: AnswerResult[];
}

function saveProgress(data: SavedProgress) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch {}
}

function loadProgress(): SavedProgress | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as SavedProgress;
    if (data.questions?.length && data.currentIndex < data.questions.length) return data;
    return null;
  } catch {
    return null;
  }
}

function clearProgress() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

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
  const enabledTypes = enabledQuestionTypes.map((t) => configToType[t]).filter(Boolean);
  const matchingEnabled = enabledTypes.includes("matching");
  const sentenceCompletionEnabled = enabledTypes.includes("sentence-completion");

  // Question types by difficulty zone
  const zone1: QuestionType[] = ["matching", "en-to-native"].filter(t => enabledTypes.includes(t));
  const zone2: QuestionType[] = ["en-to-native", "true-false"].filter(t => enabledTypes.includes(t));
  const zone3: QuestionType[] = ["true-false", "type-word"].filter(t => enabledTypes.includes(t));
  const zone4: QuestionType[] = ["type-word", "sentence-completion"].filter(t => enabledTypes.includes(t));
  const zone5: QuestionType[] = enabledTypes.filter(t => t !== "matching");

  const shuffled = shuffle(pool);
  const total = shuffled.length;
  const questions: Question[] = [];
  let i = 0;

  while (i < shuffled.length) {
    // Calculate which zone this question falls in based on position
    const progress = i / total;
    let zoneTypes: QuestionType[];
    if (progress < 0.2) zoneTypes = zone1;
    else if (progress < 0.4) zoneTypes = zone2;
    else if (progress < 0.6) zoneTypes = zone3;
    else if (progress < 0.8) zoneTypes = zone4;
    else zoneTypes = zone5;

    // Try matching only in zone1
    if (matchingEnabled && progress < 0.2 && shuffled.length - i >= 5 && Math.random() < 0.3) {
      const matchWords = shuffled.slice(i, i + 5);
      questions.push({
        type: "matching",
        word: matchWords[0],
        words: matchWords,
        correctAnswer: "matched",
      });
      i += 5;
    } else {
      const word = shuffled[i];
      // Filter out sentence-completion if word has no example
      const availableTypes = zoneTypes.filter(t =>
        t !== "matching" && (t !== "sentence-completion" || (sentenceCompletionEnabled && word.example))
      );
      const fallback = availableTypes.length > 0 ? availableTypes : ["en-to-native" as QuestionType];
      const type = fallback[Math.floor(Math.random() * fallback.length)];
      questions.push(buildSingleQuestion(word, type, pool.length >= 4 ? pool : wordList));
      i++;
    }
  }

  return questions;
}

export function useGame(customPool?: WordEntry[]) {
  const pool = customPool ?? wordList;

  const [questions, setQuestions] = useState<Question[]>(() => {
    if (!customPool) {
      const saved = loadProgress();
      if (saved) return saved.questions;
    }
    return generateQuestions(pool);
  });
  const [currentIndex, setCurrentIndex] = useState(() => {
    if (!customPool) { const s = loadProgress(); if (s) return s.currentIndex; }
    return 0;
  });
  const [score, setScore] = useState(() => {
    if (!customPool) { const s = loadProgress(); if (s) return s.score; }
    return 0;
  });
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(() => {
    if (!customPool) { const s = loadProgress(); if (s) return s.streak; }
    return 0;
  });
  const [transitioning, setTransitioning] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>(() => {
    if (!customPool) { const s = loadProgress(); if (s) return s.results; }
    return [];
  });

  const currentQuestion = questions[currentIndex] ?? null;

  // Save progress whenever relevant state changes
  useEffect(() => {
    if (gameOver) {
      clearProgress();
    } else if (questions.length > 0 && !customPool) {
      saveProgress({ questions, currentIndex, score, streak, results });
    }
  }, [questions, currentIndex, score, streak, results, gameOver, customPool]);

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

      setTimeout(() => {
        setTransitioning(true);
        setTimeout(() => {
          if (currentIndex + 1 >= questions.length) {
            setGameOver(true);
          } else {
            setCurrentIndex((i) => i + 1);
          }
          setAnswered(false);
          setSelectedAnswer(null);
          setIsCorrect(null);
          setTransitioning(false);
        }, 300);
      }, feedbackDelay);
    },
    [answered, currentQuestion, currentIndex, questions.length]
  );

  const restart = useCallback((newPool?: WordEntry[]) => {
    clearProgress();
    const p = newPool ?? pool;
    setQuestions(generateQuestions(p));
    setCurrentIndex(0);
    setScore(0);
    setAnswered(false);
    setSelectedAnswer(null);
    setIsCorrect(null);
    setGameOver(false);
    setStreak(0);
    setTransitioning(false);
    setResults([]);
  }, [pool]);

  return {
    currentQuestion,
    currentIndex,
    totalQuestions: questions.length,
    score,
    answered,
    selectedAnswer,
    isCorrect,
    gameOver,
    streak,
    transitioning,
    results,
    submitAnswer,
    restart,
  };
}
