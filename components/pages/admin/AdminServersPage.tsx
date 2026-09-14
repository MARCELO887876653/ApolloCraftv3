import React, { useState, useEffect } from 'react';
import { Server, Plus, RefreshCw, Key, Copy, Check, ShieldCheck } from 'lucide-react';

export function AdminServersPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  const [servers, setServers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [name, setName] = useState('');
  const [identifier, setIdentifier] = useState('apollo-bedrock-01');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [createdKey, setCreatedKey] = useState<string | null>(null);

  useEffect(() => {
    loadServers();
  }, []);

  const loadServers = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/servidores');
      const data = await res.json();
      if (data.servers) setServers(data.servers);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCreateServer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/servidores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, identifier }),
      });

      const data = await res.json();
      if (data.rawApiKey) {
        setCreatedKey(data.rawApiKey);
      }
      setShowAddModal(false);
      await loadServers();
    } catch {
      alert('Erro ao registrar servidor.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2500);
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Nós de Servidores Bedrock & APIs</h2>
          <p className="text-xs text-slate-400">
            Gerencie instâncias autorizadas do ApolloCraft e credenciais HMAC-SHA256.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-950/40 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Registrar Novo Nó
        </button>
      </div>

      {createdKey && (
        <div className="p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-xs space-y-2">
          <div className="flex items-center gap-2 font-bold text-emerald-400">
            <ShieldCheck className="w-4 h-4" />
            Nova Chave API Gerada com Sucesso! (Copie agora, ela não será exibida novamente)
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={createdKey}
              className="flex-1 p-2.5 rounded-lg bg-slate-900 border border-white/10 font-mono text-white text-xs"
            />
            <button
              onClick={() => copyToClipboard(createdKey)}
              className="px-3 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold transition-colors"
            >
              {copiedKey === createdKey ? 'Copiado!' : 'Copiar Chave'}
            </button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
            Carregando servidores...
          </div>
        ) : servers.length === 0 ? (
          <div className="col-span-2 py-12 text-center text-slate-500">
            Nenhum servidor Bedrock registrado ainda.
          </div>
        ) : (
          servers.map((srv) => (
            <div
              key={srv.id}
              className="p-5 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                    <Server className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{srv.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono">{srv.identifier}</span>
                  </div>
                </div>

                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/20">
                  ONLINE
                </span>
              </div>

              <div className="border-t border-white/5 pt-3 flex items-center justify-between text-xs text-slate-400">
                <span>Último Heartbeat: {srv.last_heartbeat ? new Date(srv.last_heartbeat).toLocaleTimeString('pt-BR') : 'Aguardando'}</span>
                <span className="font-mono text-[11px]">HMAC Ativo</span>
              </div>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white">Registrar Novo Nó Minecraft</h3>

            <form onSubmit={handleCreateServer} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome de Exibição</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: Servidor Principal Bedrock"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Identificador de Nó</label>
                <input
                  type="text"
                  required
                  placeholder="Ex: bedrock-survival-01"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white font-mono"
                />
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  Criar e Gerar Chave
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
