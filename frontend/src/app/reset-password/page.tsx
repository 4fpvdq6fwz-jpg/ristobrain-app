'use client';

import { Suspense, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Brain, ArrowLeft, Check } from 'lucide-react';

function ResetInner() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get('token') || '';
  const [pwd, setPwd] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwd.length < 8) { toast.error('La password deve essere di almeno 8 caratteri'); return; }
    if (pwd !== confirm) { toast.error('Le password non coincidono'); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(token, pwd);
      setDone(true);
      setTimeout(() => router.push('/login'), 2500);
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Link non valido o scaduto');
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <p className="text-white/60 text-sm text-center">
        Link non valido. Richiedi un nuovo reset dalla pagina di recupero password.
      </p>
    );
  }

  if (done) {
    return (
      <div className="text-center">
        <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
          <Check className="text-green-400" size={26} />
        </div>
        <h1 className="text-2xl font-bold mb-2">Password aggiornata</h1>
        <p className="text-white/60 text-sm">Ti stiamo riportando al login...</p>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-2xl font-bold mb-2">Scegli una nuova password</h1>
      <p className="text-white/60 text-sm mb-6">Inserisci la nuova password per il tuo account.</p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="text-xs text-white/60 block mb-1">Nuova password</label>
          <input
            type="password"
            value={pwd}
            onChange={(e) => setPwd(e.target.value)}
            required
            className="w-full bg-[#1a1a1a] border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:border-orange-500 outline-none"
            placeholder="Almeno 8 caratteri"
          />
        </div>
        <div>
          <label className="text-xs text-white/60 block mb-1">Conferma password</label>
          <input
            type="password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            className="w-full bg-[#1a1a1a] border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:border-orange-500 outline-none"
            placeholder="Ripeti la password"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-colors disabled:opacity-40"
        >
          {loading ? 'Salvataggio...' : 'Reimposta password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="min-h-screen bg-[#0f0f0f] text-white flex flex-col">
      <header className="border-b border-white/10">
        <div className="max-w-md mx-auto px-5 h-16 flex items-center justify-between w-full">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Brain className="text-orange-500" size={20} /> RistoBrain
          </Link>
          <Link href="/login" className="text-sm text-white/70 hover:text-white inline-flex items-center gap-1">
            <ArrowLeft size={15} /> Accedi
          </Link>
        </div>
      </header>
      <div className="flex-1 flex items-center justify-center px-5 py-12">
        <div className="w-full max-w-md">
          <Suspense fallback={null}>
            <ResetInner />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
