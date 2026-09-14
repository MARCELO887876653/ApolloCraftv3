import React from 'react';
import Link from 'next/link';
import { ShieldAlert, Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#0B0F19] text-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900/60 border border-white/10 rounded-2xl p-8 backdrop-blur-md shadow-2xl">
        <div className="inline-flex p-4 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400">
          <ShieldAlert className="w-12 h-12" />
        </div>
        
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-white">404 - Página Não Encontrada</h1>
          <p className="text-sm text-slate-400">
            A rota ou recurso que você tentou acessar não existe ou foi movido no sistema ApolloCraft Security.
          </p>
        </div>

        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-purple-950/50 transition-all"
          >
            <Home className="w-4 h-4" />
            Página Inicial
          </Link>
          <Link
            href="/verificar"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 border border-white/10 text-slate-300 hover:text-white text-sm font-semibold transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Verificação
          </Link>
        </div>
      </div>
    </div>
  );
}
