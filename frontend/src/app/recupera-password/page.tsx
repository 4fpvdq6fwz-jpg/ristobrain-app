'use client';

import { useState } from 'react';
import Link from 'next/link';
import { authApi } from '@/lib/api';
import { Brain, ArrowLeft, Mail } from 'lucide-react';

export default function RecuperaPasswordPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setLoading(false);
    }
  };

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
          {!sent ? (
            <>
              <h1 className="text-2xl font-bold mb-2">Password dimenticata?</h1>
              <p className="text-white/60 text-sm mb-6">
                Inserisci la tua email: ti invieremo un link per reimpostare la password.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-xs text-white/60 block mb-1">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full bg-[#1a1a1a] border border-white/15 rounded-lg px-3 py-2.5 text-sm focus:border-orange-500 outline-none"
                    placeholder="tu@ristorante.it"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2.5 rounded-lg bg-orange-500 hover:bg-orange-600 font-semibold text-sm transition-colors disabled:opacity-40"
                >
                  {loading ? 'Invio...' : 'Invia link di reset'}
                </button>
              </form>
            </>
          ) : (
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-orange-500/15 flex items-center justify-center mx-auto mb-4">
                <Mail className="text-orange-400" size={26} />
              </div>
              <h1 className="text-2xl font-bold mb-2">Controlla la tua email</h1>
              <p className="text-white/60 text-sm">
                Se l indirizzo e registrato, ti abbiamo inviato un link per reimpostare la password. Controlla anche la cartella spam.
              </p>
              <Link href="/login" className="inline-block mt-6 text-orange-400 hover:underline text-sm">
                Torna al login
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
