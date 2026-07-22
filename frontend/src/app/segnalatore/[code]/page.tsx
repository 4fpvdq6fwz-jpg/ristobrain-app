'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { referralApi } from '@/lib/api';

export default function SegnalatorePage() {
  const params = useParams();
  const code = String((params && (params as any).code) || '');
  const [info, setInfo] = useState<any>(null);
  const [err, setErr] = useState(false);

  useEffect(() => {
    if (!code) return;
    referralApi.publicStatus(code).then((r: any) => setInfo(r.data)).catch(() => setErr(true));
  }, [code]);

  return (
    <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
        <div className="text-orange-400 font-bold text-lg">RistoBrain &mdash; Segnalazioni</div>
        {err && <p className="text-gray-400">Codice non trovato.</p>}
        {!err && !info && <p className="text-gray-500">Caricamento...</p>}
        {info && (
          <>
            <p className="text-gray-400">Codice <span className="font-mono text-white">{info.code}</span></p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-gray-800 rounded-lg py-3"><div className="text-2xl font-bold">{info.customers}</div><div className="text-xs text-gray-400">clienti</div></div>
              <div className="bg-gray-800 rounded-lg py-3"><div className="text-2xl font-bold">{info.months}</div><div className="text-xs text-gray-400">mesi pagati</div></div>
              <div className="bg-gray-800 rounded-lg py-3"><div className="text-2xl font-bold text-orange-400">&euro; {(((info.total_cents||0)/100)).toFixed(2)}</div><div className="text-xs text-gray-400">maturato</div></div>
            </div>
            <p className="text-xs text-gray-500">Maturi 2&euro; per ogni mese in cui un cliente che hai portato paga effettivamente l&apos;abbonamento.</p>
          </>
        )}
      </div>
    </div>
  );
}
