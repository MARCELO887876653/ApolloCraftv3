import React, { useState, useEffect } from 'react';
import { Ban, Shield, RefreshCw, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';

interface AdminBansPageProps {
  onNavigate: (path: string) => void;
  onSelectPlayer: (id: string) => void;
}

export function AdminBansPage({ onNavigate, onSelectPlayer }: AdminBansPageProps) {
  const [bans, setBans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeOnly, setActiveOnly] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadBans();
  }, [page, activeOnly]);

  const loadBans = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/bans?page=${page}&limit=15&active=${activeOnly}`);
      const data = await res.json();
      if (data.bans) {
        setBans(data.bans);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotalCount(data.pagination?.total || 0);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Punições & Banimentos</h2>
          <p className="text-xs text-slate-400">
            Registro de sanções ativas e histórico disciplinar de jogadores.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setActiveOnly(!activeOnly);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-colors ${
              activeOnly
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-white/[0.05] text-slate-300 border-white/10'
            }`}
          >
            {activeOnly ? 'Apenas Bans Ativos' : 'Exibir Histórico Completo'}
          </button>

          <button
            onClick={loadBans}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#111827]/70 border border-white/10 overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Jogador</th>
                <th className="px-5 py-3.5">Tipo</th>
                <th className="px-5 py-3.5">Motivo Público</th>
                <th className="px-5 py-3.5">Motivo Interno</th>
                <th className="px-5 py-3.5">Aplicado por</th>
                <th className="px-5 py-3.5">Expiração</th>
                <th className="px-5 py-3.5 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                    Carregando punições...
                  </td>
                </tr>
              ) : bans.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-slate-500">
                    Nenhum banimento registrado.
                  </td>
                </tr>
              ) : (
                bans.map((b) => (
                  <tr
                    key={b.id}
                    onClick={() => {
                      if (b.player?.id) {
                        onSelectPlayer(b.player.id);
                        onNavigate(`/admin/jogadores/${b.player.id}`);
                      }
                    }}
                    className="hover:bg-white/[0.02] cursor-pointer transition-colors"
                  >
                    <td className="px-5 py-4 font-bold text-white hover:text-purple-400">
                      {b.player?.gamertag || 'Desconhecido'}
                    </td>
                    <td className="px-5 py-4 font-mono font-semibold text-rose-300">{b.type}</td>
                    <td className="px-5 py-4 text-slate-300 max-w-xs truncate">{b.reason_public}</td>
                    <td className="px-5 py-4 text-slate-400 max-w-xs truncate">{b.reason_internal}</td>
                    <td className="px-5 py-4 text-slate-300">{b.issuer?.name || 'Sistema Automático'}</td>
                    <td className="px-5 py-4 font-mono text-[11px] text-slate-400">
                      {b.expires_at ? new Date(b.expires_at).toLocaleString('pt-BR') : 'Permanente'}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          b.active
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-slate-800 text-slate-400'
                        }`}
                      >
                        {b.active ? 'ATIVO' : 'REVOGADO'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>
            Página {page} de {totalPages} ({totalCount} registros)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-800 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-slate-800 disabled:opacity-40"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
