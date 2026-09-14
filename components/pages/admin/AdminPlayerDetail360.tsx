import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Shield,
  AlertTriangle,
  CheckCircle2,
  Ban,
  Lock,
  GitFork,
  Activity,
  Server,
  RefreshCw,
  PlusCircle,
  FileText,
  UserX,
  History,
  Info,
} from 'lucide-react';
import { StatusBadge } from '@/components/StatusBadge';
import { RiskBadge } from '@/components/RiskBadge';

interface AdminPlayerDetail360Props {
  playerId: string;
  onNavigate: (path: string) => void;
  admin: any;
}

export function AdminPlayerDetail360({ playerId, onNavigate, admin }: AdminPlayerDetail360Props) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'IDENTIDADE' | 'REDES' | 'VERIFICACAO' | 'ANTI_ALT' | 'PUNICOES' | 'LOGS'>('IDENTIDADE');
  const [actionLoading, setActionLoading] = useState(false);
  const [actionModal, setActionModal] = useState<string | null>(null);

  // Form inputs for modals
  const [banType, setBanType] = useState<'PERMANENT' | 'TEMPORARY'>('PERMANENT');
  const [banReasonPublic, setBanReasonPublic] = useState('');
  const [banReasonInternal, setBanReasonInternal] = useState('');
  const [banDays, setBanDays] = useState(7);
  const [playerNotes, setPlayerNotes] = useState('');
  const [unbanReason, setUnbanReason] = useState('');

  useEffect(() => {
    loadPlayerDetails();
  }, [playerId]);

  const loadPlayerDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/jogadores/${playerId}`);
      const json = await res.json();
      if (json.player) {
        setData(json);
        setPlayerNotes(json.player.notes || '');
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action: string, payload: any = {}) => {
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/jogadores/${playerId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, payload }),
      });

      const json = await res.json();
      if (!res.ok) {
        alert(json.error || 'Falha ao executar ação');
        return;
      }

      setActionModal(null);
      await loadPlayerDetails();
    } catch {
      alert('Erro de comunicação com o servidor.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading || !data) {
    return (
      <div className="min-h-[400px] flex items-center justify-center text-slate-400">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  const { player, identities, networks, verificationCodes, securityEvents, playerLinks, banEvasions, riskHistory, bans, adminLogs } = data;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Bar with Return button */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => onNavigate('/admin/jogadores')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar para lista de jogadores
        </button>

        <button
          onClick={loadPlayerDetails}
          className="p-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.08] text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Atualizar Perfil
        </button>
      </div>

      {/* Header Profile Card (Visão 360) */}
      <div className="p-6 rounded-2xl bg-[#111827]/80 border border-white/10 backdrop-blur-sm shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 p-0.5 shadow-lg shadow-purple-950/40">
            <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center font-mono font-bold text-2xl text-purple-300">
              {player.gamertag.slice(0, 2).toUpperCase()}
            </div>
          </div>

          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-2xl font-black text-white tracking-tight">{player.gamertag}</h1>
              <StatusBadge status={player.status} />
              <RiskBadge score={player.risk_score} />
            </div>

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 font-mono">
              <span>XUID: {player.xuid || 'Não informado'}</span>
              <span>•</span>
              <span>Joins: {player.join_count}</span>
              <span>•</span>
              <span>Primeiro: {new Date(player.first_seen).toLocaleDateString('pt-BR')}</span>
              <span>•</span>
              <span>Último: {new Date(player.last_seen).toLocaleString('pt-BR')}</span>
            </div>
          </div>
        </div>

        {/* Quick Administrative Trigger Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          {player.status !== 'VERIFIED' ? (
            <button
              onClick={() => handleAction('MANUAL_VERIFY')}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md shadow-emerald-950/40 transition-colors"
            >
              Verificar Manualmente
            </button>
          ) : (
            <button
              onClick={() => handleAction('REVOKE_VERIFICATION')}
              disabled={actionLoading}
              className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold transition-colors"
            >
              Revogar Verificação
            </button>
          )}

          {player.status !== 'BANNED' && player.status !== 'TEMP_BANNED' ? (
            <button
              onClick={() => setActionModal('BAN')}
              className="px-3.5 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-md shadow-rose-950/40 transition-colors flex items-center gap-1.5"
            >
              <Ban className="w-3.5 h-3.5" />
              Aplicar Ban
            </button>
          ) : (
            <button
              onClick={() => setActionModal('UNBAN')}
              className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition-colors"
            >
              Desbanir Jogador
            </button>
          )}

          <button
            onClick={() => handleAction('RECALCULATE_RISK')}
            disabled={actionLoading}
            className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-slate-300 text-xs font-semibold transition-colors"
          >
            Recalcular Risco
          </button>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-white/10 overflow-x-auto pb-px">
        {[
          { id: 'IDENTIDADE', label: '1. Identidade & Dispositivos', count: identities.length },
          { id: 'REDES', label: '2. Redes & Anti-VPN', count: networks.length },
          { id: 'VERIFICACAO', label: '3. Sessões & Códigos', count: verificationCodes.length },
          { id: 'ANTI_ALT', label: '4. Anti-Alt & Evasão', count: playerLinks.length + banEvasions.length },
          { id: 'PUNICOES', label: '5. Punições & Bans', count: bans.length },
          { id: 'LOGS', label: '6. Auditoria Admin', count: adminLogs.length },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-3 text-xs font-semibold whitespace-nowrap border-b-2 transition-all flex items-center gap-2 ${
              activeTab === tab.id
                ? 'border-purple-500 text-purple-300 bg-purple-500/[0.04]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            {tab.label}
            {tab.count > 0 && (
              <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 font-mono">
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Tab 1: Identidade */}
      {activeTab === 'IDENTIDADE' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-2xl bg-[#111827]/70 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Dispositivos Utilizados
            </h3>
            {identities.length === 0 ? (
              <p className="text-xs text-slate-500">Nenhum dado de dispositivo coletado ainda.</p>
            ) : (
              identities.map((idRecord: any) => (
                <div key={idRecord.id} className="p-4 rounded-xl bg-slate-900/60 border border-white/5 space-y-2 text-xs">
                  <div className="flex items-center justify-between text-slate-400">
                    <span className="font-semibold text-white">Plataforma: {idRecord.platform}</span>
                    <span className="font-mono text-[11px]">{new Date(idRecord.created_at).toLocaleString('pt-BR')}</span>
                  </div>
                  <div className="text-slate-300">
                    Modelo: <span className="font-mono text-purple-300">{idRecord.device_model || 'Padrão Bedrock'}</span>
                  </div>
                  <div className="text-slate-300">
                    Sistema Operacional: <span className="font-mono text-slate-200">{idRecord.device_os || 'Desconhecido'}</span>
                  </div>
                  {idRecord.client_id && (
                    <div className="text-slate-400 font-mono text-[11px] truncate">
                      Client ID: {idRecord.client_id}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>

          <div className="p-6 rounded-2xl bg-[#111827]/70 border border-white/10 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Anotações Internas da Moderação
            </h3>
            <textarea
              value={playerNotes}
              onChange={(e) => setPlayerNotes(e.target.value)}
              placeholder="Adicione anotações confidenciais sobre este jogador..."
              rows={4}
              className="w-full p-3.5 rounded-xl bg-slate-900/90 border border-white/10 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition-colors"
            />
            <button
              onClick={() => handleAction('ADD_NOTE', { notes: playerNotes })}
              disabled={actionLoading}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors"
            >
              Salvar Anotação Interna
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: Redes & Anti-VPN */}
      {activeTab === 'REDES' && (
        <div className="rounded-2xl bg-[#111827]/70 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">
              Histórico de Conexões de Rede e Análise de IP
            </h3>
            <span className="text-xs text-slate-400">
              {data.permissions?.canViewIp ? 'Visualização completa de IP autorizada' : 'IPs mascarados por segurança'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Endereço IP</th>
                  <th className="p-3">VPN / Proxy</th>
                  <th className="p-3">Provedor / ASN</th>
                  <th className="p-3">País</th>
                  <th className="p-3">Data</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {networks.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center py-6 text-slate-500">
                      Nenhuma conexão gravada.
                    </td>
                  </tr>
                ) : (
                  networks.map((net: any) => (
                    <tr key={net.id} className="hover:bg-white/[0.02]">
                      <td className="p-3 font-mono text-purple-300 font-semibold">{net.ip_address}</td>
                      <td className="p-3">
                        {net.is_vpn || net.is_proxy || net.is_tor ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            VPN DETECTADA
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400">
                            Residencial Limpo
                          </span>
                        )}
                      </td>
                      <td className="p-3 font-mono">{net.organization || net.asn || 'Padrão'}</td>
                      <td className="p-3 font-mono">{net.country || 'BR'}</td>
                      <td className="p-3 text-slate-400 font-mono text-[11px]">
                        {new Date(net.created_at).toLocaleString('pt-BR')}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Verificação */}
      {activeTab === 'VERIFICACAO' && (
        <div className="rounded-2xl bg-[#111827]/70 border border-white/10 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Histórico de Códigos e Sessões de Verificação
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 border-b border-white/10 text-slate-400 uppercase text-[10px]">
                <tr>
                  <th className="p-3">Código (Preview Seguro)</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Tentativas</th>
                  <th className="p-3">Criado em</th>
                  <th className="p-3">Expira em</th>
                  <th className="p-3">Utilizado em</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5 font-mono text-[11px]">
                {verificationCodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-6 text-slate-500">
                      Nenhum código gerado para este jogador.
                    </td>
                  </tr>
                ) : (
                  verificationCodes.map((c: any) => (
                    <tr key={c.id}>
                      <td className="p-3 text-purple-300 font-bold">{c.code_display_preview}</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          c.status === 'USED' ? 'bg-emerald-500/20 text-emerald-400' :
                          c.status === 'ACTIVE' ? 'bg-sky-500/20 text-sky-400' : 'bg-slate-800 text-slate-400'
                        }`}>
                          {c.status}
                        </span>
                      </td>
                      <td className="p-3">{c.attempts} / {c.max_attempts}</td>
                      <td className="p-3 text-slate-400">{new Date(c.created_at).toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-slate-400">{new Date(c.expires_at).toLocaleString('pt-BR')}</td>
                      <td className="p-3 text-emerald-400">{c.used_at ? new Date(c.used_at).toLocaleString('pt-BR') : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 4: Anti-Alt & Evasão */}
      {activeTab === 'ANTI_ALT' && (
        <div className="space-y-6">
          <div className="rounded-2xl bg-[#111827]/70 border border-white/10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <GitFork className="w-4 h-4 text-indigo-400" />
              Contas Secundárias Correlacionadas (Alts)
            </h3>

            {playerLinks.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Nenhuma conta associada encontrada até o momento.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {playerLinks.map((link: any) => (
                  <div key={link.id} className="p-4 rounded-xl bg-slate-900/70 border border-white/5 space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-white">Gamertag: {link.other_player?.gamertag || 'Desconhecido'}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 font-mono">
                        {link.confidence_score}% Confiança
                      </span>
                    </div>
                    <div className="text-slate-400 text-[11px]">
                      Sinais: <span className="text-slate-300 font-mono">{link.signals.join(', ')}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="rounded-2xl bg-[#111827]/70 border border-white/10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Suspeitas de Evasão de Banimento (Ban Evasion)
            </h3>

            {banEvasions.length === 0 ? (
              <p className="text-xs text-slate-500 py-4">Nenhuma evasão de ban detectada para esta conta.</p>
            ) : (
              <div className="space-y-3">
                {banEvasions.map((ev: any) => (
                  <div key={ev.id} className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-rose-300 font-bold">
                      <span>Conta Banida Anterior: {ev.banned_player?.gamertag || 'ID Banned'}</span>
                      <span className="font-mono">{ev.confidence_score}% Match</span>
                    </div>
                    <p className="text-slate-300 text-[11px]">
                      Detectado compartilhamento de hardware/rede com jogador que possui banimento ativo.
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Punições */}
      {activeTab === 'PUNICOES' && (
        <div className="rounded-2xl bg-[#111827]/70 border border-white/10 p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Histórico de Punições</h3>
            <button
              onClick={() => setActionModal('BAN')}
              className="px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold transition-colors"
            >
              Nova Punição
            </button>
          </div>

          {bans.length === 0 ? (
            <p className="text-xs text-slate-500 py-6 text-center">Nenhuma punição registrada para este jogador.</p>
          ) : (
            <div className="space-y-3">
              {bans.map((b: any) => (
                <div key={b.id} className={`p-4 rounded-xl border text-xs space-y-2 ${
                  b.active ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-900/60 border-white/5 opacity-70'
                }`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        b.active ? 'bg-rose-500/20 text-rose-300' : 'bg-slate-800 text-slate-400'
                      }`}>
                        {b.active ? 'BAN ATIVO' : 'REVOGADO / EXPIRADO'}
                      </span>
                      <span className="font-bold text-white">{b.type}</span>
                    </div>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {new Date(b.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-400">Motivo Público: </span>
                    <span className="text-white font-medium">{b.reason_public}</span>
                  </div>

                  <div>
                    <span className="text-slate-400">Motivo Interno: </span>
                    <span className="text-slate-300">{b.reason_internal}</span>
                  </div>

                  {b.expires_at && (
                    <div className="text-[11px] text-amber-400">
                      Expira em: {new Date(b.expires_at).toLocaleString('pt-BR')}
                    </div>
                  )}

                  {!b.active && b.unban_reason && (
                    <div className="text-[11px] text-emerald-400 border-t border-white/5 pt-2 mt-2">
                      Desbanido: {b.unban_reason}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 6: Logs */}
      {activeTab === 'LOGS' && (
        <div className="rounded-2xl bg-[#111827]/70 border border-white/10 p-6 space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Auditoria de Ações Administrativas neste Jogador
          </h3>
          <div className="divide-y divide-white/5 text-xs">
            {adminLogs.length === 0 ? (
              <p className="text-center py-6 text-slate-500">Nenhum registro de auditoria.</p>
            ) : (
              adminLogs.map((log: any) => (
                <div key={log.id} className="py-3 flex items-center justify-between gap-4">
                  <div>
                    <span className="font-mono text-purple-300 font-bold">{log.action}</span>
                    <span className="text-slate-400 ml-2">por {log.admin_user?.name || 'Administrador'}</span>
                  </div>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {new Date(log.created_at).toLocaleString('pt-BR')}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Ban Modal */}
      {actionModal === 'BAN' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Ban className="w-5 h-5 text-rose-400" />
              Banir Jogador: {player.gamertag}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Tipo de Banimento</label>
                <select
                  value={banType}
                  onChange={(e) => setBanType(e.target.value as any)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                >
                  <option value="PERMANENT">Permanente</option>
                  <option value="TEMPORARY">Temporário</option>
                </select>
              </div>

              {banType === 'TEMPORARY' && (
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Duração (Dias)</label>
                  <input
                    type="number"
                    min="1"
                    max="365"
                    value={banDays}
                    onChange={(e) => setBanDays(Number(e.target.value))}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                  />
                </div>
              )}

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motivo Público (Exibido na tela de kick)</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Violação das regras da comunidade"
                  value={banReasonPublic}
                  onChange={(e) => setBanReasonPublic(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Motivo Interno (Exclusivo para Moderadores)</label>
                <textarea
                  required
                  placeholder="Ex: Evidências gravadas no discord de botting e proxy residencial..."
                  value={banReasonInternal}
                  onChange={(e) => setBanReasonInternal(e.target.value)}
                  rows={3}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-300 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={() =>
                  handleAction('BAN', {
                    type: banType,
                    reasonPublic: banReasonPublic,
                    reasonInternal: banReasonInternal,
                    durationDays: banType === 'TEMPORARY' ? banDays : null,
                  })
                }
                disabled={actionLoading || !banReasonPublic || !banReasonInternal}
                className="flex-1 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-xs font-semibold text-white transition-colors disabled:opacity-50"
              >
                Confirmar Banimento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Unban Modal */}
      {actionModal === 'UNBAN' && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Desbanir Jogador</h3>
            <p className="text-xs text-slate-300">
              Você está prestes a revogar todas as punições ativas de <strong>{player.gamertag}</strong>.
            </p>

            <div className="text-xs">
              <label className="block text-slate-300 font-semibold mb-1">Motivo do Desbanimento</label>
              <input
                type="text"
                placeholder="Ex: Apelação aceita no ticket #402"
                value={unbanReason}
                onChange={(e) => setUnbanReason(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
              />
            </div>

            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setActionModal(null)}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleAction('UNBAN', { unbanReason })}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-semibold text-white"
              >
                Confirmar Desbanimento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
