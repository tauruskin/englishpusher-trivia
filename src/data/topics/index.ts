import { WordEntry } from "@/data/wordList";
import adjectives from "./adjectives";
import stativeVerbs from "./stative-verbs";
import personalityAdjectives from "./personality-adjectives";
import adverbsOfFrequency from "./adverbs-of-frequency";
import jobs from "./jobs";
import storyWords from "./story-words";

export interface Topic {
  id: string;
  name: string;
  wordList: WordEntry[];
}

const topics: Topic[] = [
  { id: "adjectives", name: "Adjectives for Feelings", wordList: adjectives },
  { id: "stative-verbs", name: "Stative Verbs", wordList: stativeVerbs },
  { id: "personality-adjectives", name: "Personality & Relationships", wordList: personalityAdjectives },
  { id: "adverbs-of-frequency", name: "Adverbs of Frequency", wordList: adverbsOfFrequency },
  { id: "jobs", name: "Jobs", wordList: jobs },
  { id: "story-words", name: "Story Words", wordList: storyWords },
];

export default topics;
