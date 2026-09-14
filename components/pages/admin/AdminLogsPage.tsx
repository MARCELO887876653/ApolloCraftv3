import React, { useState, useEffect } from 'react';
import { FileText, RefreshCw, Filter, Search, ChevronLeft, ChevronRight } from 'lucide-react';

export function AdminLogsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadLogs();
  }, [page]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/logs?page=${page}&limit=25`);
      const data = await res.json();
      if (data.logs) {
        setLogs(data.logs);
        setTotalPages(data.pagination?.totalPages || 1);
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
          <h2 className="text-xl font-bold text-white tracking-tight">Logs de Auditoria (Append-Only)</h2>
          <p className="text-xs text-slate-400">
            Registro imutável de todas as ações administrativas realizadas no sistema.
          </p>
        </div>

        <button
          onClick={loadLogs}
          className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Atualizar Logs
        </button>
      </div>

      <div className="rounded-2xl bg-[#111827]/70 border border-white/10 overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase text-[10px]">
              <tr>
                <th className="p-3.5">Administrador</th>
                <th className="p-3.5">Ação Executada</th>
                <th className="p-3.5">Alvo (Target)</th>
                <th className="p-3.5">Detalhes / Metadados</th>
                <th className="p-3.5 text-right">Data & Hora</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-sans">
              {loading ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
                    Carregando registros de auditoria...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="text-center py-12 text-slate-500">
                    Nenhum log de auditoria registrado.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-white/[0.02]">
                    <td className="p-3.5 font-bold text-white">
                      {log.admin_user?.name || log.admin_user?.email || 'Sistema'}
                    </td>
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 text-purple-300 border border-purple-500/20">
                        {log.action}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-300">
                      {log.target_type}: {log.target_id?.slice(0, 8)}...
                    </td>
                    <td className="p-3.5 text-slate-400 font-mono text-[11px] max-w-sm truncate">
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="p-3.5 text-slate-500 font-mono text-[11px] text-right">
                      {new Date(log.created_at).toLocaleString('pt-BR')}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400">
          <span>Página {page} de {totalPages}</span>
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
