import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Users,
  ChevronLeft,
  ChevronRight,
  Shield,
  Eye,
  RefreshCw,
  SlidersHorizontal,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { RiskBadge } from '@/components/RiskBadge';

interface AdminPlayersPageProps {
  onNavigate: (path: string) => void;
  onSelectPlayer: (playerId: string) => void;
}

export function AdminPlayersPage({ onNavigate, onSelectPlayer }: AdminPlayersPageProps) {
  const [players, setPlayers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [riskFilter, setRiskFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    loadPlayers();
  }, [page, statusFilter, riskFilter]);

  const loadPlayers = async (searchOverride?: string) => {
    setLoading(true);
    try {
      const term = searchOverride !== undefined ? searchOverride : search;
      const params = new URLSearchParams({
        page: String(page),
        limit: '15',
        search: term,
        status: statusFilter,
        risk: riskFilter,
      });

      const res = await fetch(`/api/admin/jogadores?${params.toString()}`);
      const data = await res.json();

      if (data.players) {
        setPlayers(data.players);
        setTotalPages(data.pagination.totalPages || 1);
        setTotalCount(data.pagination.total || 0);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadPlayers();
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Gestão de Jogadores</h2>
          <p className="text-xs text-slate-400">
            Total de {totalCount} jogadores catalogados no ecossistema ApolloCraft.
          </p>
        </div>

        <button
          onClick={() => loadPlayers()}
          className="self-start sm:self-auto px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-xs font-semibold text-slate-300 flex items-center gap-2 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-purple-400' : ''}`} />
          Atualizar Lista
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="w-full sm:w-80 relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por Gamertag..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-purple-500 transition-colors"
          />
        </form>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">Todos os Status</option>
              <option value="VERIFIED">Verificado</option>
              <option value="PENDING">Pendente</option>
              <option value="BANNED">Banido</option>
              <option value="RESTRICTED">Restrito</option>
              <option value="MANUAL_REVIEW">Revisão Manual</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-medium">Risco:</span>
            <select
              value={riskFilter}
              onChange={(e) => {
                setRiskFilter(e.target.value);
                setPage(1);
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200 focus:outline-none focus:border-purple-500"
            >
              <option value="ALL">Qualquer Risco</option>
              <option value="HIGH">Crítico / Alto (&gt;= 61)</option>
              <option value="SUSPICIOUS">Médio / Atenção (41-60)</option>
              <option value="NORMAL">Normal / Baixo (&lt;= 20)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Players Table */}
      <div className="rounded-2xl bg-[#111827]/70 border border-white/10 overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="px-5 py-3.5">Jogador (Gamertag)</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Pontuação de Risco</th>
                <th className="px-5 py-3.5">Contas Relacionadas</th>
                <th className="px-5 py-3.5">Último Acesso</th>
                <th className="px-5 py-3.5 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                    Carregando jogadores...
                  </td>
                </tr>
              ) : players.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-slate-500">
                    Nenhum jogador encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                players.map((p) => (
                  <tr
                    key={p.id}
                    onClick={() => {
                      onSelectPlayer(p.id);
                      onNavigate(`/admin/jogadores/${p.id}`);
                    }}
                    className="hover:bg-white/[0.03] transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-mono font-bold text-purple-300">
                          {p.gamertag.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <span className="font-bold text-white text-sm hover:text-purple-400 transition-colors">
                            {p.gamertag}
                          </span>
                          {p.xuid && (
                            <span className="block text-[10px] text-slate-500 font-mono">
                              XUID: {p.xuid}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-5 py-4">
                      <StatusBadge status={p.status} />
                    </td>

                    <td className="px-5 py-4">
                      <RiskBadge score={p.risk_score} />
                    </td>

                    <td className="px-5 py-4">
                      {p.is_alt ? (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/15 text-amber-300 border border-amber-500/20">
                          Alt Suspeito
                        </span>
                      ) : (
                        <span className="text-slate-500 text-[11px] font-mono">Conta Principal</span>
                      )}
                    </td>

                    <td className="px-5 py-4 text-slate-400 font-mono text-[11px]">
                      {new Date(p.last_seen).toLocaleString('pt-BR')}
                    </td>

                    <td className="px-5 py-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectPlayer(p.id);
                          onNavigate(`/admin/jogadores/${p.id}`);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-purple-300 text-xs font-semibold border border-white/5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Visão 360
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>
            Página {page} de {totalPages} ({totalCount} jogadores)
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
