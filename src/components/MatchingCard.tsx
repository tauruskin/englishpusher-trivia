import { useState, useCallback, useEffect } from "react";
import {
  DndContext,
  DragOverlay,
  useDraggable,
  useDroppable,
  MouseSensor,
  TouchSensor,
  useSensors,
  useSensor,
  type DragEndEvent,
} from "@dnd-kit/core";
import { Question } from "@/hooks/useGame";
import GameCharacter, { CharacterPose } from "@/components/GameCharacter";
import SpeakerButton from "@/components/SpeakerButton";

/* ── helpers ────────────────────────────────────── */
function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/* ── draggable word ─────────────────────────────── */
interface DraggableProps {
  id: string;
  children: React.ReactNode;
  disabled?: boolean;
}

const DraggableWord = ({ id, children, disabled }: DraggableProps) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id,
    disabled,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`, zIndex: 50 }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      style={style}
      className={`transition-shadow ${isDragging ? "opacity-50" : ""}`}
    >
      {children}
    </div>
  );
};

/* ── droppable zone ─────────────────────────────── */
interface DroppableProps {
  id: string;
  children: React.ReactNode;
}

const DroppableZone = ({ id, children }: DroppableProps) => {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={`transition-all duration-150 ${isOver ? "ring-2 ring-primary scale-[1.03]" : ""}`}
    >
      {children}
    </div>
  );
};

/* ── main component ─────────────────────────────── */
interface MatchingCardProps {
  question: Question;
  transitioning: boolean;
  onSubmit: (answer: string) => void;
  speak: (word: string) => void;
  speakIfInteracted: (word: string) => void;
}

const MatchingCard = ({ question, transitioning, onSubmit, speak }: MatchingCardProps) => {
  const words = question.words!;

  const [shuffledTranslations] = useState(() =>
    shuffle(words.map((w) => w.translation))
  );
  const [correctPairs, setCorrectPairs] = useState<Set<string>>(new Set());
  const [selected, setSelected] = useState<string | null>(null);
  const [shaking, setShaking] = useState<string | null>(null);
  const [allDone, setAllDone] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } })
  );

  const checkMatch = useCallback(
    (englishWord: string, translation: string) => {
      if (correctPairs.has(englishWord)) return;
      const entry = words.find((w) => w.word === englishWord);
      if (entry && entry.translation === translation) {
        const next = new Set(correctPairs);
        next.add(englishWord);
        setCorrectPairs(next);
        if (next.size === words.length) {
          setAllDone(true);
        }
      } else {
        setShaking(translation);
        setTimeout(() => setShaking(null), 500);
      }
      setSelected(null);
    },
    [correctPairs, words]
  );

  // When all done, celebrate then advance
  useEffect(() => {
    if (allDone) {
      const timer = setTimeout(() => onSubmit("matched"), 2000);
      return () => clearTimeout(timer);
    }
  }, [allDone, onSubmit]);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      setActiveId(null);
      const { active, over } = event;
      if (over) {
        checkMatch(active.id as string, over.id as string);
      }
    },
    [checkMatch]
  );

  const handleWordClick = (word: string) => {
    if (correctPairs.has(word) || allDone) return;
    setSelected(selected === word ? null : word);
  };

  const handleTranslationClick = (translation: string) => {
    if (allDone) return;
    // Check if this translation is already matched
    const matchedWord = words.find(
      (w) => correctPairs.has(w.word) && w.translation === translation
    );
    if (matchedWord) return;

    if (selected) {
      checkMatch(selected, translation);
    }
  };

  const characterPose: CharacterPose = allDone ? "celebrate" : "thinking";

  const getWordStyle = (word: string) => {
    if (correctPairs.has(word))
      return "bg-success/20 border-success text-success cursor-default";
    if (selected === word)
      return "bg-primary/20 border-primary text-primary ring-2 ring-primary cursor-pointer";
    return "bg-secondary border-border text-foreground cursor-grab hover:border-primary/50 hover:scale-[1.02] active:cursor-grabbing";
  };

  const getTranslationStyle = (translation: string) => {
    const matchedWord = words.find(
      (w) => correctPairs.has(w.word) && w.translation === translation
    );
    if (matchedWord)
      return "bg-success/20 border-success text-success cursor-default";
    if (shaking === translation)
      return "bg-destructive/20 border-destructive text-destructive animate-shake cursor-pointer";
    return "bg-secondary border-border text-foreground cursor-pointer hover:border-primary/50 hover:scale-[1.02]";
  };

  return (
    <div className="flex items-center gap-6 w-full">
      <GameCharacter pose={characterPose} className="flex-shrink-0" />
      <div
        className={`flex-1 w-full max-w-2xl mx-auto space-y-5 bg-card rounded-2xl p-6 md:p-8 border border-border shadow-md relative overflow-hidden transition-all duration-300 ${
          transitioning ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0 animate-slide-up"
        }`}
      >
        {/* Celebration overlay */}
        {allDone && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-10">
            <span className="text-7xl animate-emoji-correct">🎉</span>
          </div>
        )}

        {/* Type label */}
        <div className="flex justify-center">
          <span className="text-xs uppercase tracking-widest text-accent font-display font-semibold">
            Match the Pairs
          </span>
        </div>

        <p className="text-muted-foreground text-center text-sm">
          {allDone
            ? "All matched! Great job! 🎊"
            : "Drag or click an English word, then tap its Ukrainian translation"}
        </p>

        <p className="text-center text-xs text-muted-foreground">
          {correctPairs.size}/{words.length} matched
        </p>

        <DndContext
          sensors={sensors}
          onDragStart={(e) => setActiveId(e.active.id as string)}
          onDragEnd={handleDragEnd}
          onDragCancel={() => setActiveId(null)}
        >
          <div className="grid grid-cols-2 gap-4">
            {/* Left: English words */}
            <div className="space-y-2">
              <p className="text-xs font-display font-semibold text-muted-foreground text-center mb-1">
                English
              </p>
              {words.map((w) => (
                <DraggableWord
                  key={w.word}
                  id={w.word}
                  disabled={correctPairs.has(w.word) || allDone}
                >
                  <div
                    onClick={() => handleWordClick(w.word)}
                    className={`px-3 py-2.5 rounded-lg border-2 font-body text-sm md:text-base text-center transition-all duration-200 select-none flex items-center justify-center gap-1 ${getWordStyle(w.word)}`}
                  >
                    {w.word}
                    {!correctPairs.has(w.word) && <SpeakerButton word={w.word} onSpeak={speak} className="w-6 h-6 text-xs" />}
                  </div>
                </DraggableWord>
              ))}
            </div>

            {/* Right: Ukrainian translations */}
            <div className="space-y-2">
              <p className="text-xs font-display font-semibold text-muted-foreground text-center mb-1">
                Ukrainian
              </p>
              {shuffledTranslations.map((t) => (
                <DroppableZone key={t} id={t}>
                  <div
                    onClick={() => handleTranslationClick(t)}
                    className={`px-3 py-2.5 rounded-lg border-2 font-body text-sm md:text-base text-center transition-all duration-200 select-none ${getTranslationStyle(t)}`}
                  >
                    {t}
                  </div>
                </DroppableZone>
              ))}
            </div>
          </div>

          {/* Drag overlay */}
          <DragOverlay>
            {activeId ? (
              <div className="px-3 py-2.5 rounded-lg border-2 border-primary bg-primary/20 text-primary font-body text-sm md:text-base text-center shadow-lg">
                {activeId}
              </div>
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default MatchingCard;
