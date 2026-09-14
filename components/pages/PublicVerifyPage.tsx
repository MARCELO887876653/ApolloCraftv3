import React, { useState } from 'react';
import { Shield, CheckCircle2, AlertTriangle, ArrowRight, RefreshCw, KeyRound, User, HelpCircle } from 'lucide-react';

interface PublicVerifyPageProps {
  onNavigate: (path: string) => void;
}

export function PublicVerifyPage({ onNavigate }: PublicVerifyPageProps) {
  const [gamertag, setGamertag] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    code?: string;
    remainingAttempts?: number;
    gamertag?: string;
  } | null>(null);

  // Auto-format code helper (e.g. typing "apollok7p491m2" formats to "APOLLO-K7P4-91M2")
  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let raw = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
    setCode(raw);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!gamertag.trim() || !code.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/verificar', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gamertag: gamertag.trim(),
          code: code.trim(),
        }),
      });

      const data = await res.json();
      setResult({
        success: data.success,
        message: data.message || (data.success ? 'Conta verificada!' : 'Falha na verificação.'),
        code: data.code,
        remainingAttempts: data.remainingAttempts,
        gamertag: data.gamertag,
      });

      if (data.success) {
        setCode('');
      }
    } catch (err: any) {
      setResult({
        success: false,
        message: 'Erro de conexão com o servidor de segurança. Verifique sua internet e tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0F19] text-white flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-purple-600/10 blur-[100px] rounded-full pointer-events-none" />

      <div className="max-w-md w-full mx-auto relative z-10">
        {/* Verification Card Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-purple-600 to-sky-500 p-0.5 shadow-xl shadow-purple-950/50 mb-4">
            <div className="w-full h-full bg-[#0B0F19] rounded-[14px] flex items-center justify-center">
              <Shield className="w-7 h-7 text-purple-400" />
            </div>
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Verificação de Jogador
          </h2>
          <p className="text-sm text-slate-400 mt-2">
            Insira sua Gamertag do Bedrock e o código gerado no servidor
          </p>
        </div>

        {/* Verification Form Card */}
        <div className="bg-[#111827]/80 border border-white/10 rounded-2xl p-6 sm:p-8 backdrop-blur-md shadow-2xl">
          {result?.success ? (
            /* Success View */
            <div className="text-center py-4">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto mb-4 animate-bounce">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Conta Verificada com Sucesso!</h3>
              <p className="text-sm text-slate-300 mb-6 leading-relaxed">
                A conta <span className="font-bold text-purple-300">{result.gamertag || gamertag}</span> foi
                autorizada. Você já pode retornar ao servidor Minecraft Bedrock e jogar normalmente!
              </p>

              <div className="p-4 rounded-xl bg-slate-900/80 border border-white/5 text-xs text-slate-400 mb-6 font-mono">
                Servidor: play.apollocraft.online:19132
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setResult(null)}
                  className="flex-1 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors"
                >
                  Verificar Outra Conta
                </button>
                <button
                  onClick={() => onNavigate('/')}
                  className="flex-1 py-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold transition-colors"
                >
                  Voltar ao Início
                </button>
              </div>
            </div>
          ) : (
            /* Input Form */
            <form onSubmit={handleSubmit} className="space-y-5">
              {result && !result.success && (
                <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-start gap-3">
                  <AlertTriangle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{result.message}</p>
                    {typeof result.remainingAttempts === 'number' && (
                      <p className="text-[11px] text-rose-400/80">
                        Tentativas restantes para este código: {result.remainingAttempts}
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Gamertag Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Sua Gamertag Bedrock
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <User className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={gamertag}
                    onChange={(e) => setGamertag(e.target.value)}
                    placeholder="Ex: SteveBedrock"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Digite exatamente como aparece no seu Minecraft.
                </span>
              </div>

              {/* Code Input */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Código de Verificação
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
                    <KeyRound className="w-4 h-4" />
                  </div>
                  <input
                    type="text"
                    required
                    value={code}
                    onChange={handleCodeChange}
                    placeholder="APOLLO-XXXX-XXXX"
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-slate-900/90 border border-white/10 text-white placeholder-slate-500 text-sm font-mono tracking-wider focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 transition-colors uppercase"
                  />
                </div>
                <span className="text-[11px] text-slate-500 mt-1 block">
                  Exibido na sua tela ao tentar entrar no servidor.
                </span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 font-semibold text-white text-sm shadow-lg shadow-purple-950/50 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Validando Código com Segurança...</span>
                  </>
                ) : (
                  <>
                    <span>Confirmar Verificação</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Help Accordion / Tips */}
          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-300 mb-2">
              <HelpCircle className="w-4 h-4 text-purple-400" />
              Não recebeu o código?
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Entre no servidor Bedrock com o IP <strong className="text-slate-200">play.apollocraft.online:19132</strong>.
              O servidor gerará um código temporário automático válido por 15 minutos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
