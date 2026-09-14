import React from 'react';
import { ArrowLeft, Shield } from 'lucide-react';

export function PublicPrivacyPage({ onNavigate }: { onNavigate: (path: string) => void }) {
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
          <h1 className="text-3xl font-extrabold tracking-tight text-white">Política de Privacidade</h1>
        </div>

        <div className="prose prose-invert max-w-none text-slate-300 text-sm leading-relaxed space-y-6">
          <p>
            O <strong>ApolloCraft Security</strong> prioriza a segurança dos dados e a transparência em relação
            às informações coletadas para a proteção da nossa rede Bedrock.
          </p>

          <h3 className="text-lg font-bold text-white mt-6">1. Dados Coletados</h3>
          <p>Para garantir a proteção do servidor e validação de jogadores, são processados:</p>
          <ul className="list-disc pl-5 space-y-2 text-slate-400">
            <li>Gamertag e identificadores de plataforma (ex: XUID e Client ID fornecidos pelo cliente Bedrock).</li>
            <li>Endereço IP de conexão (armazenado de forma criptografada por hash HMAC-SHA256 para correlação).</li>
            <li>Dados técnicos de rede pública (provedor ASN, país e classificação de proxy/VPN).</li>
          </ul>

          <h3 className="text-lg font-bold text-white mt-6">2. Retenção e Descarte</h3>
          <p>
            Registros de IP e conexões são descartados periodicamente conforme a rotina de manutenção
            automática (CRON cleanup), respeitando os limites de necessidade de segurança e combate a fraudes.
          </p>

          <h3 className="text-lg font-bold text-white mt-6">3. Compartilhamento</h3>
          <p>
            Nenhum dado é comercializado ou compartilhado com terceiros, exceto provedores de infraestrutura
            estritamente necessários (ex: verificação de reputação de IP).
          </p>
        </div>
      </div>
    </div>
  );
}
