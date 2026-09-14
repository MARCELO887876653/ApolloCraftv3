import React, { useState, useEffect } from 'react';
import { Settings, Shield, RefreshCw, Save, CheckCircle2, AlertCircle } from 'lucide-react';

export function AdminSettingsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [settings, setSettings] = useState<any>({
    antiVpnMode: 'BLOCK',
    ipCacheTtlDays: 30,
    maxAltsAllowed: 2,
    codeExpirationMinutes: 15,
    discordWebhookUrl: '',
    requireVerificationForAll: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/configuracoes');
      const data = await res.json();
      if (data.settings) setSettings(data.settings);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaved(false);

    try {
      const res = await fetch('/api/admin/configuracoes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      });

      if (res.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch {
      alert('Erro ao salvar configurações.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Configurações de Segurança</h2>
          <p className="text-xs text-slate-400">
            Ajuste as políticas globais de tolerância a VPNs, expiração de códigos e integração Discord.
          </p>
        </div>

        {saved && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg bg-emerald-500/20 text-emerald-400 text-xs font-semibold">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Configurações salvas!
          </span>
        )}
      </div>

      <form onSubmit={handleSave} className="space-y-6">
        {/* Anti-VPN Policy */}
        <div className="p-6 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400" />
            Política de Proteção Anti-VPN / Proxy
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Modo de Ação ao Detectar VPN / Proxy / Tor
              </label>
              <select
                value={settings.antiVpnMode}
                onChange={(e) => setSettings({ ...settings, antiVpnMode: e.target.value })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
              >
                <option value="BLOCK">BLOCK (Bloquear conexão imediatamente no nó Bedrock)</option>
                <option value="RESTRICT">RESTRICT (Permitir conexão, mas exigir verificação com revisão)</option>
                <option value="MONITOR">MONITOR (Apenas registrar log e elevar score de risco)</option>
                <option value="OFF">OFF (Desativado)</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Expiração de Códigos de Verificação (Minutos)
              </label>
              <input
                type="number"
                min="5"
                max="60"
                value={settings.codeExpirationMinutes}
                onChange={(e) => setSettings({ ...settings, codeExpirationMinutes: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
              />
            </div>
          </div>
        </div>

        {/* Anti-Alt Limits */}
        <div className="p-6 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Diretrizes Anti-Alt & Limites de Contas
          </h3>

          <div className="space-y-3 text-xs">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Máximo de Contas Permitidas por Dispositivo / Rede
              </label>
              <input
                type="number"
                min="1"
                max="10"
                value={settings.maxAltsAllowed}
                onChange={(e) => setSettings({ ...settings, maxAltsAllowed: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
              />
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">
                Retenção do Cache de Inteligência de IP (Dias)
              </label>
              <input
                type="number"
                min="7"
                max="90"
                value={settings.ipCacheTtlDays}
                onChange={(e) => setSettings({ ...settings, ipCacheTtlDays: Number(e.target.value) })}
                className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
              />
            </div>
          </div>
        </div>

        {/* Discord Webhook */}
        <div className="p-6 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm space-y-4">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">
            Integração com Discord (Alertas de Staff)
          </h3>

          <div className="text-xs">
            <label className="block text-slate-300 font-semibold mb-1">
              URL do Webhook do Canal de Moderação
            </label>
            <input
              type="text"
              placeholder="https://discord.com/api/webhooks/..."
              value={settings.discordWebhookUrl}
              onChange={(e) => setSettings({ ...settings, discordWebhookUrl: e.target.value })}
              className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-purple-950/50 transition-colors"
        >
          <Save className="w-4 h-4" />
          {saving ? 'Salvando Alterações...' : 'Salvar Configurações'}
        </button>
      </form>
    </div>
  );
}
