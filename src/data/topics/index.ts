import { WordEntry } from "@/data/wordList";
import adjectives from "./adjectives";
import stativeVerbs from "./stative-verbs";

export interface Topic {
  id: string;
  name: string;
  wordList: WordEntry[];
}

const topics: Topic[] = [
  { id: "adjectives", name: "Adjectives for Feelings", wordList: adjectives },
  { id: "stative-verbs", name: "Stative Verbs", wordList: stativeVerbs },
];

export default topics;
