export default function ScoreBadge({ score }) {
  if (score == null) return null;
  const pct = Math.round(score * 100);
  const color = score > 0.7 ? 'bg-green-500' : score > 0.4 ? 'bg-yellow-500' : 'bg-red-500';
  const textColor = score > 0.7 ? 'text-green-400' : score > 0.4 ? 'text-yellow-400' : 'text-red-400';

  return (
    <div className="flex items-center gap-1.5">
      <div className="w-12 h-1.5 bg-zinc-700 rounded-full overflow-hidden">
        <div className={`h-full ${color} rounded-full`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-xs font-medium ${textColor}`}>{pct}%</span>
    </div>
  );
}
