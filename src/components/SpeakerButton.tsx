interface SpeakerButtonProps {
  word: string;
  onSpeak: (word: string) => void;
  className?: string;
}

const SpeakerButton = ({ word, onSpeak, className = "" }: SpeakerButtonProps) => {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onSpeak(word); }}
      className={`inline-flex items-center justify-center w-8 h-8 rounded-full hover:bg-primary/10 transition-colors text-primary ${className}`}
      aria-label={`Pronounce ${word}`}
      type="button"
    >
      🔊
    </button>
  );
};

export default SpeakerButton;
