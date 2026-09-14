import React from 'react';
import { PlayerStatus } from '@/lib/types/database';

interface StatusBadgeProps {
  status: PlayerStatus | string;
  size?: 'sm' | 'md';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-2.5 py-1 text-xs font-semibold';

  switch (status) {
    case 'VERIFIED':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
          Verificado
        </span>
      );
    case 'PENDING':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
          Pendente
        </span>
      );
    case 'BANNED':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />
          Banido
        </span>
      );
    case 'TEMP_BANNED':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-orange-400" />
          Ban Temporário
        </span>
      );
    case 'RESTRICTED':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
          Restrito
        </span>
      );
    case 'SUSPICIOUS':
    case 'MANUAL_REVIEW':
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-yellow-500/10 text-yellow-300 border border-yellow-500/30 ${sizeClasses}`}>
          <span className="w-1.5 h-1.5 rounded-full bg-yellow-300" />
          Revisão Manual
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center gap-1 rounded-full bg-slate-500/10 text-slate-400 border border-slate-500/30 ${sizeClasses}`}>
          {status}
        </span>
      );
  }
}
