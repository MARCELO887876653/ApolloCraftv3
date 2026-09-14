import React from 'react';
import Link from 'next/link';
import {
  LayoutDashboard,
  Users,
  Ban,
  ShieldAlert,
  GitFork,
  FileText,
  UserCheck,
  Server,
  Settings,
  LogOut,
  ExternalLink,
  Shield,
} from 'lucide-react';
import { AdminRoleName } from '@/lib/types/database';

interface AdminSidebarProps {
  currentPath: string;
  onNavigate?: (path: string) => void;
  adminName?: string;
  adminRole?: AdminRoleName;
  onLogout?: () => void;
}

export function AdminSidebar({
  currentPath,
  onNavigate,
  adminName = 'Administrador',
  adminRole = 'ADMIN',
  onLogout,
}: AdminSidebarProps) {
  const menuItems = [
    { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
    { label: 'Jogadores', path: '/admin/jogadores', icon: Users },
    { label: 'Bans & Punições', path: '/admin/bans', icon: Ban },
    { label: 'Segurança & VPN', path: '/admin/seguranca', icon: ShieldAlert },
    { label: 'Anti-Alt & Evasão', path: '/admin/contas-relacionadas', icon: GitFork },
    { label: 'Auditoria & Logs', path: '/admin/logs', icon: FileText },
    { label: 'Administradores', path: '/admin/administradores', icon: UserCheck },
    { label: 'Servidores & APIs', path: '/admin/servidores', icon: Server },
    { label: 'Configurações', path: '/admin/configuracoes', icon: Settings },
  ];

  const handleItemClick = (e: React.MouseEvent, path: string) => {
    e.preventDefault();
    if (onNavigate) {
      onNavigate(path);
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'OWNER':
        return 'bg-amber-500/20 text-amber-300 border-amber-500/30';
      case 'ADMIN':
        return 'bg-purple-500/20 text-purple-300 border-purple-500/30';
      case 'MODERATOR':
        return 'bg-blue-500/20 text-blue-300 border-blue-500/30';
      default:
        return 'bg-slate-500/20 text-slate-300 border-slate-500/30';
    }
  };

  return (
    <aside className="w-64 border-r border-white/10 bg-[#0E131F] flex flex-col flex-shrink-0 h-screen sticky top-0 overflow-y-auto">
      {/* Header / Logo */}
      <div className="p-5 border-b border-white/10 flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-sky-400 p-0.5">
          <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
            <Shield className="w-4 h-4 text-purple-400" />
          </div>
        </div>
        <div>
          <div className="text-sm font-bold text-white tracking-wide">APOLLOCRAFT</div>
          <div className="text-[10px] uppercase font-mono tracking-widest text-purple-400">
            Painel de Controle
          </div>
        </div>
      </div>

      {/* Admin User Info Card */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-xs font-semibold text-white truncate max-w-[140px]">
            {adminName}
          </span>
          <span
            className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${getRoleBadgeColor(
              adminRole
            )}`}
          >
            {adminRole}
          </span>
        </div>
        <div className="text-[11px] text-slate-400 truncate">Sessão Segura Ativa</div>
      </div>

      {/* Nav Menu */}
      <nav className="p-3 space-y-1 flex-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.path;

          return (
            <a
              key={item.path}
              href={item.path}
              onClick={(e) => handleItemClick(e, item.path)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30 shadow-sm shadow-purple-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-purple-400' : 'text-slate-500'}`} />
              {item.label}
            </a>
          );
        })}
      </nav>

      {/* Footer Actions */}
      <div className="p-3 border-t border-white/10 space-y-2">
        <Link
          href="/"
          onClick={(e) => handleItemClick(e, '/')}
          className="flex items-center justify-between w-full px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/[0.04] transition-colors"
        >
          <span>Acessar Site Público</span>
          <ExternalLink className="w-3.5 h-3.5 opacity-60" />
        </Link>

        <button
          onClick={onLogout}
          className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-medium text-rose-400 hover:bg-rose-500/10 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" />
          Encerrar Sessão
        </button>
      </div>
    </aside>
  );
}
