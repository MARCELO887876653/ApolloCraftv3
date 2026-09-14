import React, { useState, useEffect } from 'react';
import { GitFork, AlertTriangle, RefreshCw, Eye, Shield } from 'lucide-react';

interface AdminAntiAltPageProps {
  onNavigate: (path: string) => void;
  onSelectPlayer: (id: string) => void;
}

export function AdminAntiAltPage({ onNavigate, onSelectPlayer }: AdminAntiAltPageProps) {
  const [links, setLinks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAntiAlt();
  }, []);

  const loadAntiAlt = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/contas-relacionadas');
      const data = await res.json();
      if (data.links) setLinks(data.links);
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
          <h2 className="text-xl font-bold text-white tracking-tight">Anti-Alt & Evasão de Ban</h2>
          <p className="text-xs text-slate-400">
            Correlação heurística de redes, client IDs e dispositivos para detecção de contas secundárias.
          </p>
        </div>

        <button
          onClick={loadAntiAlt}
          className="p-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs flex items-center gap-2"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Recalcular Vínculos
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
            Analisando vínculos de contas...
          </div>
        ) : links.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            Nenhum vínculo suspeito ou conta alternativa detectada.
          </div>
        ) : (
          links.map((link) => (
            <div
              key={link.id}
              className="p-5 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <GitFork className="w-4 h-4 text-purple-400" />
                  Vínculo de Hardware / Rede
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold font-mono bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {link.confidence_score}% Confiança
                </span>
              </div>

              <div className="p-3 rounded-xl bg-slate-900/60 border border-white/5 flex items-center justify-between text-xs">
                <div>
                  <span className="text-slate-400 text-[10px] block">Conta 1</span>
                  <button
                    onClick={() => {
                      onSelectPlayer(link.player_a_id);
                      onNavigate(`/admin/jogadores/${link.player_a_id}`);
                    }}
                    className="font-bold text-white hover:text-purple-300 transition-colors"
                  >
                    {link.player_a?.gamertag || link.player_a_id}
                  </button>
                </div>

                <span className="text-slate-600 font-bold">⇄</span>

                <div className="text-right">
                  <span className="text-slate-400 text-[10px] block">Conta 2</span>
                  <button
                    onClick={() => {
                      onSelectPlayer(link.player_b_id);
                      onNavigate(`/admin/jogadores/${link.player_b_id}`);
                    }}
                    className="font-bold text-white hover:text-purple-300 transition-colors"
                  >
                    {link.player_b?.gamertag || link.player_b_id}
                  </button>
                </div>
              </div>

              <div className="text-[11px] text-slate-400">
                Sinais Correlacionados: <span className="text-slate-200 font-mono">{link.signals?.join(', ')}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
