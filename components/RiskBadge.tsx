import React from 'react';

interface RiskBadgeProps {
  score: number;
  showScore?: boolean;
}

export function RiskBadge({ score, showScore = true }: RiskBadgeProps) {
  let colorClasses = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
  let label = 'Baixo';

  if (score >= 81) {
    colorClasses = 'bg-red-500/20 text-red-400 border-red-500/40 animate-pulse';
    label = 'Crítico';
  } else if (score >= 61) {
    colorClasses = 'bg-rose-500/15 text-rose-400 border-rose-500/30';
    label = 'Alto';
  } else if (score >= 41) {
    colorClasses = 'bg-amber-500/15 text-amber-400 border-amber-500/30';
    label = 'Médio';
  } else if (score >= 21) {
    colorClasses = 'bg-yellow-500/10 text-yellow-300 border-yellow-500/20';
    label = 'Atenção';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border ${colorClasses}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" />
      {label}
      {showScore && <span className="opacity-75 font-mono">({score})</span>}
    </span>
  );
}
