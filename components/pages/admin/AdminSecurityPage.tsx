import React, { useState, useEffect } from 'react';
import { ShieldAlert, RefreshCw, AlertTriangle, Globe2, Zap, Filter } from 'lucide-react';

export function AdminSecurityPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severity, setSeverity] = useState('ALL');

  useEffect(() => {
    loadEvents();
  }, [severity]);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/seguranca?severity=${severity}&limit=50`);
      const data = await res.json();
      if (data.events) setEvents(data.events);
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
          <h2 className="text-xl font-bold text-white tracking-tight">Eventos de Segurança & VPN</h2>
          <p className="text-xs text-slate-400">
            Monitoramento de tentativas de invasão, bloqueios de proxy e anomalias de rede.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={severity}
            onChange={(e) => setSeverity(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-white/10 text-xs text-slate-200"
          >
            <option value="ALL">Todas as Severidades</option>
            <option value="CRITICAL">Crítico</option>
            <option value="HIGH">Alto</option>
            <option value="MEDIUM">Médio</option>
            <option value="LOW">Baixo</option>
          </select>

          <button
            onClick={loadEvents}
            className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      <div className="rounded-2xl bg-[#111827]/70 border border-white/10 overflow-hidden backdrop-blur-sm shadow-xl">
        <div className="divide-y divide-white/5">
          {loading ? (
            <div className="py-12 text-center text-slate-500">
              <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
              Carregando eventos...
            </div>
          ) : events.length === 0 ? (
            <div className="py-12 text-center text-slate-500">
              Nenhum evento de segurança recente.
            </div>
          ) : (
            events.map((ev) => (
              <div key={ev.id} className="p-4 hover:bg-white/[0.02] flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <span
                    className={`mt-1 w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      ev.severity === 'CRITICAL' || ev.severity === 'HIGH'
                        ? 'bg-rose-400 animate-pulse'
                        : ev.severity === 'MEDIUM'
                        ? 'bg-amber-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{ev.event_type}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/10 text-purple-300 border border-purple-500/20">
                        {ev.severity}
                      </span>
                    </div>

                    <p className="text-slate-400 mt-1 text-[11px]">
                      {ev.metadata ? JSON.stringify(ev.metadata) : 'Sem metadados'}
                    </p>
                  </div>
                </div>

                <span className="text-slate-500 font-mono text-[11px] whitespace-nowrap">
                  {new Date(ev.created_at).toLocaleString('pt-BR')}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
