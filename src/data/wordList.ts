/**
 * Englishpusher Trivia — Word List Config
 * Topic: Adjectives for Feelings (-ed / -ing adjectives)
 * 
 * Edit this file to swap vocabulary for different lessons.
 * Each entry needs: word (English), translation (Ukrainian).
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

const wordList: WordEntry[] = [
  { word: "bored", translation: "нудьгуючий" },
  { word: "boring", translation: "нудний" },
  { word: "excited", translation: "захоплений" },
  { word: "exciting", translation: "захоплюючий" },
  { word: "embarrassing", translation: "бентежний, соромно, незручний" },
  { word: "embarrassed", translation: "збентежений, зніяковілий" },
  { word: "annoyed", translation: "роздратований" },
  { word: "annoying", translation: "дратуючий" },
  { word: "frightened", translation: "наляканий" },
  { word: "frightening", translation: "лякаючий" },
  { word: "surprised", translation: "здивований" },
  { word: "surprising", translation: "дивуючий" },
  { word: "amazing", translation: "дивовижний" },
  { word: "amazed", translation: "вражений" },
  { word: "disappointed", translation: "розчарований" },
  { word: "disappointing", translation: "розчаровуючий" },
  { word: "terrified", translation: "нажаханий" },
  { word: "terrifying", translation: "жахливий" },
  { word: "exhausted", translation: "виснажений" },
  { word: "exhausting", translation: "виснажливий" },
  { word: "silly", translation: "дурний" },
  { word: "calm", translation: "спокійний" },
  { word: "jealous", translation: "ревнивий, заздрісний" },
  { word: "in love", translation: "закоханий" },
  { word: "nervous", translation: "знервований" },
  { word: "sleepy", translation: "сонний" },
  { word: "worried", translation: "схвильований" },
];

export default wordList;
