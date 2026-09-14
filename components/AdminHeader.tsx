import React from 'react';
import { Menu, ShieldCheck, Bell, RefreshCw } from 'lucide-react';

interface AdminHeaderProps {
  title: string;
  subtitle?: string;
  onRefresh?: () => void;
  isLoading?: boolean;
  onToggleMobileMenu?: () => void;
}

export function AdminHeader({
  title,
  subtitle,
  onRefresh,
  isLoading = false,
  onToggleMobileMenu,
}: AdminHeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full h-16 border-b border-white/10 bg-[#0B0F19]/90 backdrop-blur-md px-4 sm:px-8 flex items-center justify-between">
      <div className="flex items-center gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}
        <div>
          <h1 className="text-lg font-bold text-white tracking-tight">{title}</h1>
          {subtitle && <p className="text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>

      <div className="flex items-center gap-3">
        {/* Node status indicator */}
        <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          Nó Bedrock Conectado
        </div>

        {onRefresh && (
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 disabled:opacity-50 transition-colors"
            title="Recarregar dados"
          >
            <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-purple-400' : ''}`} />
          </button>
        )}
      </div>
    </header>
  );
}
