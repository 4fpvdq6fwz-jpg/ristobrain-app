'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Cookie } from 'lucide-react';

export default function CookieBanner() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem('rb_cookie_consent')) setShow(true);
    } catch {}
  }, []);

  const choose = (value: string) => {
    try { localStorage.setItem('rb_cookie_consent', value); } catch {}
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-0 inset-x-0 z-50 p-3 sm:p-4">
      <div className="max-w-3xl mx-auto rounded-xl border border-white/15 bg-[#1a1a1a] shadow-xl p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="flex items-start gap-3 flex-1">
          <Cookie className="text-orange-400 shrink-0 mt-0.5" size={20} />
          <p className="text-sm text-white/70 leading-relaxed">
            Usiamo cookie tecnici necessari e, solo con il tuo consenso, strumenti di misurazione.{' '}
            <Link href="/cookie" className="text-orange-400 hover:underline">Maggiori informazioni</Link>.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => choose('rejected')}
            className="px-4 py-2 text-sm rounded-lg border border-white/15 text-white/80 hover:text-white hover:border-white/30 transition-colors"
          >
            Rifiuta
          </button>
          <button
            onClick={() => choose('accepted')}
            className="px-4 py-2 text-sm rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
          >
            Accetta
          </button>
        </div>
      </div>
    </div>
  );
}
