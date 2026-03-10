/**
 * Englishpusher Trivia — Word List Config
 *
 * This file re-exports the default topic's word list and shared types.
 * To add new topics, see src/data/topics/index.ts.
 */
export interface WordEntry {
  word: string;
  translation: string;
}

export type EnabledQuestionType = 'multipleChoice' | 'reversed' | 'typeTheWord' | 'trueOrFalse' | 'matching';

/**
 * Toggle question types on/off per lesson.
 * - multipleChoice: English word → pick Ukrainian translation
 * - reversed: Ukrainian translation → pick English word
 * - typeTheWord: Ukrainian translation → type the English word
 * - trueOrFalse: Is this English–Ukrainian pair correct?
 * - matching: Click-to-match 5 English words to their Ukrainian translations
 */
export const enabledQuestionTypes: EnabledQuestionType[] = [
  'multipleChoice',
  'reversed',
  'typeTheWord',
  'trueOrFalse',
  'matching',
];

import adjectives from "./topics/adjectives";

const wordList: WordEntry[] = adjectives;

export default wordList;
