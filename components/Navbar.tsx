import React from 'react';
import Link from 'next/link';
import { Shield, Sparkles, Server, CheckCircle2, Lock, ExternalLink } from 'lucide-react';

interface NavbarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function Navbar({ currentPath = '/', onNavigate }: NavbarProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B0F19]/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo */}
        <Link
          href="/"
          onClick={(e) => handleClick(e, '/')}
          className="flex items-center gap-3 group transition-transform hover:scale-102"
        >
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-sky-400 p-0.5 shadow-lg shadow-purple-900/30">
            <div className="w-full h-full bg-[#0B0F19] rounded-[10px] flex items-center justify-center">
              <Shield className="w-5 h-5 text-purple-400 group-hover:text-purple-300 transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="text-lg font-bold tracking-tight text-white flex items-center gap-1.5">
              APOLLO<span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-sky-400">CRAFT</span>
              <span className="px-1.5 py-0.5 text-[10px] uppercase font-bold tracking-wider rounded bg-purple-500/20 text-purple-300 border border-purple-500/30">
                Security
              </span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">play.apollocraft.online:19132</span>
          </div>
        </Link>

        {/* Public Navigation */}
        <nav className="hidden md:flex items-center gap-6">
          <Link
            href="/"
            onClick={(e) => handleClick(e, '/')}
            className={`text-sm font-medium transition-colors ${
              currentPath === '/' ? 'text-purple-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            Início
          </Link>
          <Link
            href="/verificar"
            onClick={(e) => handleClick(e, '/verificar')}
            className={`text-sm font-medium flex items-center gap-1.5 transition-colors ${
              currentPath === '/verificar' ? 'text-purple-400' : 'text-slate-300 hover:text-white'
            }`}
          >
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            Verificação
          </Link>
          <a
            href="https://discord.gg/apollocraft"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-slate-300 hover:text-white flex items-center gap-1 transition-colors"
          >
            Discord
            <ExternalLink className="w-3.5 h-3.5 opacity-60" />
          </a>
        </nav>

        {/* Admin Login Button */}
        <div className="flex items-center gap-3">
          <Link
            href="/verificar"
            onClick={(e) => handleClick(e, '/verificar')}
            className="hidden sm:inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-md shadow-purple-950/50 transition-all"
          >
            Verificar Conta
          </Link>
          <Link
            href="/admin/login"
            onClick={(e) => handleClick(e, '/admin/login')}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-700/80 border border-white/10 transition-colors"
          >
            <Lock className="w-3.5 h-3.5 text-purple-400" />
            Admin
          </Link>
        </div>
      </div>
    </header>
  );
}
