interface EndScreenProps {
  score: number;
  total: number;
  onRestart: () => void;
}

const EndScreen = ({ score, total, onRestart }: EndScreenProps) => {
  const pct = Math.round((score / total) * 100);
  const emoji = pct >= 80 ? "🎉" : pct >= 50 ? "👍" : "💪";
  const message = pct >= 80 ? "Excellent work!" : pct >= 50 ? "Good effort!" : "Keep practicing!";

  return (
    <div className="w-full max-w-md mx-auto text-center space-y-8 animate-in fade-in duration-500">
      <div className="text-6xl">{emoji}</div>
      <h2 className="font-display text-3xl font-bold text-foreground">{message}</h2>
      <div className="bg-card rounded-2xl p-8 border border-border shadow-md space-y-4">
        <div className="text-5xl font-display font-bold text-primary">{pct}%</div>
        <p className="text-muted-foreground">
          You got <span className="text-foreground font-semibold">{score}</span> out of{" "}
          <span className="text-foreground font-semibold">{total}</span> correct
        </p>
      </div>
      <button
        onClick={onRestart}
        className="px-8 py-3.5 rounded-lg bg-primary text-primary-foreground font-display font-semibold text-lg hover:opacity-90 transition-opacity"
      >
        Play Again
      </button>
    </div>
  );
};

export default EndScreen;
