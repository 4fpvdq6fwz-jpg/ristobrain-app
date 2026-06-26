'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Brain, Check, X, Loader2 } from 'lucide-react';

function VerifyInner() {
  const params = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'loading' | 'ok' | 'error'>('loading');

  useEffect(() => {
    if (!token) { setStatus('error'); return; }
    authApi
      .verifyEmail(token)
      .then(() => setStatus('ok'))
      .catch(() => setStatus('error'));
  }, [token]);

  if (status === 'loading') {
    return (
      <div className="text-center">
        <Loader2 className="animate-spin text-orange-400 mx-auto mb-4" size={28} />
        <p className="text-white/60 text-sm">Verifica in corso...</p>
      </div>
    );
  }

  if (status === 'ok') {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
          <Check className="text-green-400" size={26} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Email confermata</h1>
        <p className="text-white/60 text-sm">Il tuo indirizzo email e stato verificato con successo.</p>
        <Link href="/dashboard" className="inline-block mt-6 px-5 py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm">
          Vai alla dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="text-center">
      <div className="w-14 h-14 rounded-full bg-red-500/15 flex items-center justify-center mx-auto mb-4">
        <X className="text-red-400" size={26} />
      </div>
      <h1 className="text-2xl font-bold mb-2">Link non valido</h1>
      <p className="text-white/60 text-sm">
        Il link di verifica non e valido o e gia stato usato. Puoi richiederne uno nuovo dalle impostazioni del tuo account.
      </p>
      <Link href="/login" className="inline-block mt-6 text-orange-400 hover:underline text-sm">
        Torna al login
      </Link>
    </div>
  );
}

export default function VerificaEmailPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      <header className="border-b border-white/10">
        <div className="max-w-md mx-auto px-5 h-16 flex items-center w-full">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Brain className="text-orange-500" size={20} /> RistoBrain
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Suspense fallback={null}>
            <VerifyInner />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
