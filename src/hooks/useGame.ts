import { useState, useCallback, useEffect } from "react";
import { WordEntry } from "@/data/wordList";

const STORAGE_KEY = "englishpusher-game-progress-v3";

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
  const shuffled = shuffle(pool);
  const questions: Question[] = [];

  // Calculate how many matching cards (10% of words, in groups of 5)
  const matchingWordCount = Math.max(5, Math.floor(pool.length * 0.1 / 5) * 5);
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

export function useGame(pool: WordEntry[]) {
  const [questions, setQuestions] = useState<Question[]>(() => generateQuestions(pool));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [streak, setStreak] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [results, setResults] = useState<AnswerResult[]>([]);

  const currentQuestion = questions[currentIndex] ?? null;

  // Save progress whenever relevant state changes
  useEffect(() => {
    if (gameOver) {
      clearProgress();
    } else if (questions.length > 0) {
      saveProgress({ questions, currentIndex, score, streak, results });
    }
  }, [questions, currentIndex, score, streak, results, gameOver]);

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
