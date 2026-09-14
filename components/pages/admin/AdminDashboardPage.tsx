import React, { useState, useEffect } from 'react';
import {
  Users,
  CheckCircle2,
  Clock,
  Ban,
  ShieldAlert,
  GitFork,
  Zap,
  Globe2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Activity,
} from 'lucide-react';
import { RiskBadge } from '@/components/RiskBadge';

interface AdminDashboardPageProps {
  onNavigate: (path: string) => void;
  admin: any;
}

export function AdminDashboardPage({ onNavigate, admin }: AdminDashboardPageProps) {
  const [stats, setStats] = useState<any>({
    totalPlayers: 0,
    verifiedPlayers: 0,
    pendingPlayers: 0,
    bannedPlayers: 0,
    highRiskPlayers: 0,
    possibleAlts: 0,
    possibleBanEvasions: 0,
    verificationsToday: 0,
    eventsLast24h: 0,
    vpnDetected: 0,
    proxyDetected: 0,
    torDetected: 0,
  });
  const [recentEvents, setRecentEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/dashboard');
      const data = await res.json();
      if (data.stats) setStats(data.stats);
      if (data.recentEvents) setRecentEvents(data.recentEvents);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8">
      {/* Welcome Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-purple-900/30 via-indigo-900/20 to-sky-900/20 border border-purple-500/20 backdrop-blur-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-mono tracking-widest text-purple-400">
              ApolloCraft Security Command Center
            </span>
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-white">
            Olá, {admin?.name || 'Administrador'}
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Monitorando servidores Bedrock em tempo real com proteção ativa anti-fraude.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate('/admin/jogadores')}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold shadow-md shadow-purple-950/50 transition-colors"
          >
            Buscar Jogadores
          </button>
          <button
            onClick={() => onNavigate('/admin/configuracoes')}
            className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-xs font-semibold transition-colors"
          >
            Ajustar Regras
          </button>
        </div>
      </div>

      {/* Main Metrics Bento Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Players */}
        <div className="p-5 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Registrados</span>
            <Users className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.totalPlayers}</div>
          <div className="text-[11px] text-slate-400 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">
              {stats.verifiedPlayers} verificados
            </span>
            <span>•</span>
            <span className="text-amber-400">{stats.pendingPlayers} pendentes</span>
          </div>
        </div>

        {/* Verifications Today */}
        <div className="p-5 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Verificações Hoje</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.verificationsToday}</div>
          <div className="text-[11px] text-slate-400 mt-1">Concluídas com sucesso</div>
        </div>

        {/* High Risk Accounts */}
        <div className="p-5 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Risco Elevado</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-extrabold text-rose-400">{stats.highRiskPlayers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Score acima de 60/100</div>
        </div>

        {/* Bans Activos */}
        <div className="p-5 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Contas Punidas</span>
            <Ban className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-extrabold text-white">{stats.bannedPlayers}</div>
          <div className="text-[11px] text-slate-400 mt-1">Bans permanentes e temp</div>
        </div>
      </div>

      {/* Secondary Security Indicators */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ShieldAlert className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{stats.vpnDetected}</div>
            <div className="text-[11px] text-slate-400">VPNs Detectadas</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Globe2 className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{stats.proxyDetected}</div>
            <div className="text-[11px] text-slate-400">Proxies / Tor</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <GitFork className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{stats.possibleAlts}</div>
            <div className="text-[11px] text-slate-400">Vínculos Anti-Alt</div>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5 flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <div className="text-lg font-bold text-white">{stats.possibleBanEvasions}</div>
            <div className="text-[11px] text-slate-400">Evasões de Ban</div>
          </div>
        </div>
      </div>

      {/* Recent Security Activity Feed */}
      <div className="rounded-2xl bg-[#111827]/70 border border-white/10 p-6 backdrop-blur-sm shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2.5">
            <Activity className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Atividades Recentes de Segurança
            </h3>
          </div>
          <button
            onClick={() => onNavigate('/admin/seguranca')}
            className="text-xs text-purple-400 hover:text-purple-300 flex items-center gap-1 transition-colors font-semibold"
          >
            Ver Histórico Completo
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentEvents.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500">
            Nenhum evento registrado no momento.
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {recentEvents.map((ev) => (
              <div
                key={ev.id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs hover:bg-white/[0.02] px-2 rounded-lg transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`w-2 h-2 rounded-full flex-shrink-0 ${
                      ev.severity === 'CRITICAL' || ev.severity === 'HIGH'
                        ? 'bg-rose-400 animate-pulse'
                        : ev.severity === 'MEDIUM'
                        ? 'bg-amber-400'
                        : 'bg-slate-400'
                    }`}
                  />
                  <div>
                    <span className="font-semibold text-white font-mono">{ev.event_type}</span>
                    {ev.metadata?.gamertag && (
                      <span className="text-purple-300 ml-2 font-medium">
                        [{ev.metadata.gamertag}]
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-slate-400 text-[11px] font-mono">
                  {ev.metadata?.ip_masked && <span>IP: {ev.metadata.ip_masked}</span>}
                  <span>{new Date(ev.created_at).toLocaleTimeString('pt-BR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
