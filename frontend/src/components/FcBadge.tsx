import clsx from 'clsx';

interface Props {
  value: number;
  target?: number;
  showLabel?: boolean;
}

export default function FcBadge({ value, target = 30, showLabel = false }: Props) {
  const pct = parseFloat(String(value));
  const isGood = pct > 0 && pct <= target;
  const isWarning = pct > target && pct <= target + 5;
  const isDanger = pct > target + 5 || pct === 0;

  return (
    <span className={clsx(
      'inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border',
      isGood && 'bg-green-500/15 text-green-400 border-green-500/30',
      isWarning && 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
      isDanger && 'bg-red-500/15 text-red-400 border-red-500/30',
    )}>
      {pct > 0 ? `${pct.toFixed(1)}%` : 'N/D'}
      {showLabel && <span className="opacity-60">FC</span>}
    </span>
  );
}
