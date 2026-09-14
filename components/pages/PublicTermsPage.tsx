import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export function PublicTermsPage({ onNavigate }: { onNavigate: (path: string) => void }) {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-white py-16 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => onNavigate('/')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-purple-400 hover:text-purple-300 mb-8 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar ao Início
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-400" />
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Termos de Serviço</h1>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-6">
          <p>
            Bem-vindo ao <strong>ApolloCraft Security</strong>. Ao conectar-se ao servidor Minecraft Bedrock
            ou utilizar a plataforma de verificação, você concorda com as diretrizes e termos abaixo.
          </p>

          <h3 className="text-lg font-bold text-white mt-6">1. Finalidade do Serviço</h3>
          <p>
            O ApolloCraft Security é um sistema de proteção ativa contra ataques de negação de serviço,
            bots, uso indevido de proxies/VPNs para invasões e burlamento de punições (anti-alt / ban evasion).
          </p>

          <h3 className="text-lg font-bold text-white mt-6">2. Conduta do Jogador</h3>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>É expressamente proibido tentar burlar sistemas de verificação através de scripts automatizados.</li>
            <li>O compartilhamento de contas para evasão de punições acarretará no banimento de todas as contas associadas.</li>
            <li>O uso de serviços de VPN abusivos poderá resultar em exigência de verificação manual ou bloqueio preventivo.</li>
          </ul>

          <h3 className="text-lg font-bold text-white mt-6">3. Punições Administrativas</h3>
          <p>
            A equipe gestora do ApolloCraft reserva-se o direito de suspender ou banir jogadores que
            violem a integridade do servidor ou que apresentem pontuação de risco crítica e padrões de fraude.
          </p>
        </div>
      </div>
    </div>
  );
}
