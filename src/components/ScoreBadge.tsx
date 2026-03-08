interface ScoreBadgeProps {
  score: number;
  total: number;
}

const ScoreBadge = ({ score, total }: ScoreBadgeProps) => (
  <div className="flex items-center gap-1.5 bg-secondary px-2.5 py-1.5 rounded-lg font-display whitespace-nowrap">
    <span className="text-primary font-bold text-sm">{score}/{total}</span>
  </div>
);

export default ScoreBadge;
