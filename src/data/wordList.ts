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
  { word: "bored", translation: "нудьгуючий", example: "I'm so ___ — there's nothing to do today." },
  { word: "boring", translation: "нудний", example: "The lecture was incredibly ___ and I almost fell asleep." },
  { word: "excited", translation: "захоплений", example: "She was really ___ about her trip to Paris." },
  { word: "exciting", translation: "захоплюючий", example: "The football match was so ___ that everyone was on their feet." },
  { word: "embarrassing", translation: "бентежний, соромно, незручний", example: "It was an ___ moment when I forgot her name." },
  { word: "embarrassed", translation: "збентежений, зніяковілий", example: "He felt ___ after tripping in front of everyone." },
  { word: "annoyed", translation: "роздратований", example: "She was ___ because her neighbour kept playing loud music." },
  { word: "annoying", translation: "дратуючий", example: "That ___ noise from the construction site won't stop." },
  { word: "frightened", translation: "наляканий", example: "The child was ___ by the loud thunder." },
  { word: "frightening", translation: "лякаючий", example: "Walking through the dark forest was a ___ experience." },
  { word: "surprised", translation: "здивований", example: "I was ___ to see my old friend at the party." },
  { word: "surprising", translation: "дивуючий", example: "The test results were ___ — nobody expected them." },
  { word: "amazing", translation: "дивовижний", example: "The view from the mountain top was absolutely ___." },
  { word: "amazed", translation: "вражений", example: "We were ___ by how quickly she learned to play the piano." },
  { word: "disappointed", translation: "розчарований", example: "He was ___ when the concert was cancelled." },
  { word: "disappointing", translation: "розчаровуючий", example: "The movie had a very ___ ending." },
  { word: "terrified", translation: "нажаханий", example: "She was absolutely ___ of flying." },
  { word: "terrifying", translation: "жахливий", example: "The horror film was the most ___ thing I've ever watched." },
  { word: "exhausted", translation: "виснажений", example: "After running a marathon, she felt completely ___." },
  { word: "exhausting", translation: "виснажливий", example: "Moving to a new apartment is always ___." },
  { word: "silly", translation: "дурний", example: "Stop being ___ and focus on your work." },
  { word: "calm", translation: "спокійний", example: "He stayed ___ even during the emergency." },
  { word: "jealous", translation: "ревнивий, заздрісний", example: "She felt ___ when her friend got a promotion." },
  { word: "in love", translation: "закоханий", example: "He's been ___ with her since they first met." },
  { word: "nervous", translation: "знервований", example: "I always get ___ before a job interview." },
  { word: "sleepy", translation: "сонний", example: "I'm feeling ___ — I think I'll go to bed early." },
  { word: "worried", translation: "схвильований", example: "She was ___ about her son's exam results." },
];

export default wordList;
