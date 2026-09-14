import React, { useState } from 'react';
import {
  Shield,
  CheckCircle2,
  Copy,
  Check,
  Gamepad2,
  Lock,
  ArrowRight,
  Zap,
  Flame,
  Globe2,
} from 'lucide-react';

interface PublicHomePageProps {
  onNavigate: (path: string) => void;
}

export function PublicHomePage({ onNavigate }: PublicHomePageProps) {
  const [copiedIp, setCopiedIp] = useState(false);

  const copyServerIp = () => {
    navigator.clipboard.writeText('play.apollocraft.online');
    setCopiedIp(true);
    setTimeout(() => setCopiedIp(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white selection:bg-purple-500 selection:text-white flex flex-col">
      {/* Hero Section */}
      <main className="flex-1">
        <section className="relative pt-16 pb-20 overflow-hidden">
          {/* Subtle ambient lighting */}
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-purple-600/15 blur-[120px] rounded-full pointer-events-none" />
          <div className="absolute top-1/3 left-1/3 w-[300px] h-[200px] bg-sky-500/10 blur-[100px] rounded-full pointer-events-none" />

          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
            {/* Server Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-semibold uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
              Minecraft Bedrock Edition
            </div>

            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight mb-6">
              Proteção Absoluta para o Universo{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-sky-400">
                ApolloCraft
              </span>
            </h1>

            <p className="text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed mb-8">
              Nosso sistema de verificação inteligente garante um ambiente limpo contra trapaças,
              VPNs abusivas e invasões de bots para todos os jogadores do ApolloCraft Bedrock.
            </p>

            {/* Quick Action Box: Server IP & Verification CTA */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 max-w-lg mx-auto mb-16">
              <button
                onClick={() => onNavigate('/verificar')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold text-white shadow-xl shadow-purple-950/60 transition-all group"
              >
                <span>Verificar Minha Conta</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={copyServerIp}
                className="w-full sm:w-auto flex items-center justify-center gap-2.5 px-5 py-3.5 rounded-xl bg-slate-900/90 hover:bg-slate-800/90 border border-white/10 font-mono text-sm text-slate-200 transition-colors"
              >
                <span>play.apollocraft.online:19132</span>
                {copiedIp ? (
                  <Check className="w-4 h-4 text-emerald-400" />
                ) : (
                  <Copy className="w-4 h-4 text-slate-400" />
                )}
              </button>
            </div>

            {/* Verification 4-Step Guide */}
            <div className="bg-[#111827]/70 border border-white/10 rounded-2xl p-6 sm:p-10 backdrop-blur-sm text-left max-w-4xl mx-auto shadow-2xl">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Lock className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Como Funciona a Verificação?</h3>
                  <p className="text-xs text-slate-400">
                    Processo rápido realizado em menos de 1 minuto
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Step 1 */}
                <div className="bg-slate-900/60 rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-purple-600/30 text-purple-400 font-mono font-bold flex items-center justify-center text-sm mb-3">
                      01
                    </div>
                    <h4 className="font-semibold text-white text-sm mb-1.5">Conecte no Servidor</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Abra o Minecraft Bedrock e entre com o IP{' '}
                      <span className="text-purple-300 font-mono">play.apollocraft.online</span>.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="bg-slate-900/60 rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-indigo-600/30 text-indigo-400 font-mono font-bold flex items-center justify-center text-sm mb-3">
                      02
                    </div>
                    <h4 className="font-semibold text-white text-sm mb-1.5">Receba seu Código</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Um código único no formato{' '}
                      <span className="text-sky-300 font-mono">APOLLO-XXXX-XXXX</span> aparecerá no
                      seu chat/tela.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="bg-slate-900/60 rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-sky-600/30 text-sky-400 font-mono font-bold flex items-center justify-center text-sm mb-3">
                      03
                    </div>
                    <h4 className="font-semibold text-white text-sm mb-1.5">Digite no Site</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Acesse a página de verificação, insira sua gamertag e o código gerado.
                    </p>
                  </div>
                </div>

                {/* Step 4 */}
                <div className="bg-slate-900/60 rounded-xl p-5 border border-white/5 flex flex-col justify-between">
                  <div>
                    <div className="w-8 h-8 rounded-lg bg-emerald-600/30 text-emerald-400 font-mono font-bold flex items-center justify-center text-sm mb-3">
                      04
                    </div>
                    <h4 className="font-semibold text-white text-sm mb-1.5">Acesso Liberado</h4>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Sua conta é instantaneamente autorizada pelo servidor em tempo real!
                    </p>
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-400">
                  ⚠️ Certifique-se de estar conectado sem VPN ou Proxy ativo para evitar bloqueios.
                </span>
                <button
                  onClick={() => onNavigate('/verificar')}
                  className="px-5 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 text-xs font-semibold text-white transition-colors"
                >
                  Ir para Verificação Agora
                </button>
              </div>
            </div>

            {/* Feature Highlights */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left max-w-4xl mx-auto">
              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                <Zap className="w-6 h-6 text-amber-400 mb-3" />
                <h4 className="font-bold text-white text-base mb-1">Zero Lag & Imediato</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Comunicação otimizada entre o nó Bedrock e a nuvem Vercel para liberação em
                  milissegundos.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                <Shield className="w-6 h-6 text-purple-400 mb-3" />
                <h4 className="font-bold text-white text-base mb-1">Anti-VPN Inteligente</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Proteção contra IPs maliciosos, data centers e redes de anonimização utilizadas
                  para invasão.
                </p>
              </div>

              <div className="p-6 rounded-xl bg-white/[0.02] border border-white/5">
                <Globe2 className="w-6 h-6 text-sky-400 mb-3" />
                <h4 className="font-bold text-white text-base mb-1">Anti-Alt & Evasão</h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Correlação avançada que impede usuários punidos de criarem contas secundárias para
                  burlar punições.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
