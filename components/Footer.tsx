import React from 'react';
import Link from 'next/link';
import { Shield, Heart } from 'lucide-react';

interface FooterProps {
  onNavigate?: (path: string) => void;
}

export function Footer({ onNavigate }: FooterProps) {
  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>, path: string) => {
    if (onNavigate) {
      e.preventDefault();
      onNavigate(path);
    }
  };

  return (
    <footer className="w-full border-t border-white/10 bg-[#0B0F19] text-slate-400 py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand Info */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-lg bg-purple-600/20 border border-purple-500/40 flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <span className="text-base font-bold text-white tracking-wide">
                APOLLOCRAFT SECURITY
              </span>
            </div>
            <p className="text-sm text-slate-400 max-w-sm leading-relaxed mb-4">
              Infraestrutura de proteção ativa para Minecraft Bedrock. Prevenção inteligente contra
              VPNs abusivas, anti-alt de alta precisão e verificação de contas.
            </p>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Servidor Bedrock: play.apollocraft.online:19132
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-slate-300 tracking-wider mb-3">
              Navegação
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/"
                  onClick={(e) => handleClick(e, '/')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Status do Servidor
                </Link>
              </li>
              <li>
                <Link
                  href="/verificar"
                  onClick={(e) => handleClick(e, '/verificar')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Verificar Conta Bedrock
                </Link>
              </li>
              <li>
                <a
                  href="https://discord.gg/apollocraft"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-purple-400 transition-colors"
                >
                  Comunidade Discord
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h4 className="text-xs uppercase font-semibold text-slate-300 tracking-wider mb-3">
              Legal & Segurança
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  href="/termos"
                  onClick={(e) => handleClick(e, '/termos')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Termos de Serviço
                </Link>
              </li>
              <li>
                <Link
                  href="/privacidade"
                  onClick={(e) => handleClick(e, '/privacidade')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Política de Privacidade
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/login"
                  onClick={(e) => handleClick(e, '/admin/login')}
                  className="hover:text-purple-400 transition-colors"
                >
                  Acesso Administrativo
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} ApolloCraft Network. Todos os direitos reservados.</p>
          <p className="flex items-center gap-1">
            Não afiliado à Mojang Studios ou Microsoft.
          </p>
        </div>
      </div>
    </footer>
  );
}
