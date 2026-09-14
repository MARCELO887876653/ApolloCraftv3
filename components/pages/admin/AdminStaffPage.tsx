import React, { useState, useEffect } from 'react';
import { UserCheck, UserPlus, Shield, RefreshCw, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export function AdminStaffPage({ onNavigate, admin }: { onNavigate: (path: string) => void; admin: any }) {
  const [staff, setStaff] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('MODERATOR');
  const [modalLoading, setModalLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStaff();
  }, []);

  const loadStaff = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/administradores');
      const data = await res.json();
      if (data.staff) setStaff(data.staff);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/admin/administradores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Falha ao criar administrador.');
        return;
      }

      setShowCreateModal(false);
      setName('');
      setEmail('');
      setPassword('');
      await loadStaff();
    } catch {
      setError('Erro de conexão.');
    } finally {
      setModalLoading(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Equipe & Permissões (RBAC)</h2>
          <p className="text-xs text-slate-400">
            Gerencie administradores, moderadores e papéis de acesso à infraestrutura de segurança.
          </p>
        </div>

        <button
          onClick={() => setShowCreateModal(true)}
          className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold flex items-center gap-2 shadow-md shadow-purple-950/40 transition-colors"
        >
          <UserPlus className="w-4 h-4" />
          Novo Administrador
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {loading ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 animate-spin text-purple-400 mx-auto mb-2" />
            Carregando membros da equipe...
          </div>
        ) : staff.length === 0 ? (
          <div className="col-span-3 py-12 text-center text-slate-500">
            Nenhum administrador encontrado.
          </div>
        ) : (
          staff.map((member) => (
            <div
              key={member.id}
              className="p-5 rounded-2xl bg-[#111827]/70 border border-white/10 backdrop-blur-sm space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center font-bold text-purple-300">
                    {member.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-white">{member.name}</h3>
                    <span className="text-[11px] text-slate-400 font-mono block">{member.email}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-white/5 pt-3 text-xs">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {member.role?.name || member.role_id || 'Membro'}
                </span>

                <span
                  className={`text-[11px] font-semibold ${
                    member.is_active ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {member.is_active ? 'Ativo' : 'Desativado'}
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#111827] border border-white/10 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-purple-400" />
              Adicionar Novo Administrador
            </h3>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs">
                {error}
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Moderador Apollo"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mod@apollocraft.online"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Senha Inicial</label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Papel (Função)</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-slate-900 border border-white/10 text-white"
                >
                  <option value="MODERATOR">MODERATOR (Visualização & Bans)</option>
                  <option value="ADMIN">ADMIN (Gestão Completa de Jogadores & Regras)</option>
                  <option value="OWNER">OWNER (Acesso Irrestrito)</option>
                </select>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={modalLoading}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold"
                >
                  {modalLoading ? 'Cadastrando...' : 'Cadastrar Membro'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
