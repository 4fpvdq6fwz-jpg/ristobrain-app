'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { billingApi } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import toast from 'react-hot-toast';
import { CreditCard, Zap, Check, AlertTriangle } from 'lucide-react';

interface BillingStatus {
  plan: 'free' | 'pro';
  subscriptionStatus: string | null;
  hasCustomer: boolean;
  expiresAt: string | null;
}

const PRO_FEATURES = [
  'Locali illimitati',
  'Menu illimitati',
  'Ingredienti e ricette illimitati',
  'AI Consulente avanzato',
  'Knowledge base personalizzata',
  'Analisi food cost avanzate',
  'Menu engineering professionale',
  'Supporto prioritario',
];

const FREE_FEATURES = [
  '1 locale',
  'Fino a 30 ricette',
  'Fino a 50 ingredienti',
  'AI Consulente base',
];

export default function BillingPage() {
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState(false);
  const auth = getAuth();
  const isOwner = auth?.workspace?.role === 'owner';

  useEffect(() => {
    loadStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      toast.success('Abbonamento Pro attivato! Benvenuto.');
      window.history.replaceState({}, '', '/billing');
    }
    if (params.get('canceled') === '1') {
      toast('Pagamento annullato.', { icon: 'ℹ️' });
      window.history.replaceState({}, '', '/billing');
    }
  }, []);

  const loadStatus = async () => {
    try {
      const res = await billingApi.status();
      setStatus(res.data);
    } catch {
      toast.error('Errore nel caricamento del piano');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async () => {
    if (!isOwner) { toast.error("Solo il proprietario può gestire l'abbonamento"); return; }
    setRedirecting(true);
    try {
      const res = await billingApi.createCheckout();
      window.location.href = res.data.url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore nel checkout');
      setRedirecting(false);
    }
  };

  const handleManage = async () => {
    if (!isOwner) { toast.error("Solo il proprietario può gestire l'abbonamento"); return; }
    setRedirecting(true);
    try {
      const res = await billingApi.createPortal();
      window.location.href = res.data.url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore nel portale');
      setRedirecting(false);
    }
  };

  const isPro = status?.plan === 'pro';
  const isPastDue = status?.subscriptionStatus === 'past_due';

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">Piano e Abbonamento</h1>
          <p className="text-dark-200 text-sm mt-1">Gestisci il tuo piano RistoBrain</p>
        </div>

        {isPastDue && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-300">Pagamento non riuscito</p>
              <p className="text-xs text-red-400 mt-0.5">Aggiorna il metodo di pagamento per continuare ad usare il piano Pro.</p>
              {isOwner && (
                <button onClick={handleManage} disabled={redirecting} className="mt-2 text-xs text-red-300 underline hover:text-red-200">
                  Aggiorna metodo di pagamento →
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-dark-300">Caricamento...</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            {/* Piano Free */}
            <div className={`card-dark border ${!isPro ? 'border-brand-500/50' : 'border-dark-600'} relative`}>
              {!isPro && (
                <div className="absolute -top-3 left-4">
                  <span className="text-xs bg-brand-500 text-white px-3 py-1 rounded-full font-semibold">Piano attuale</span>
                </div>
              )}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">Free</h2>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">€0</span>
                  <span className="text-dark-300 text-sm">/mese</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {FREE_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-dark-200">
                    <Check size={14} className="text-dark-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {!isPro && <div className="text-xs text-center text-dark-400 py-2 bg-dark-700 rounded-lg">Piano corrente</div>}
            </div>

            {/* Piano Pro */}
            <div className={`card-dark border ${isPro ? 'border-brand-500/50' : 'border-dark-600'} relative`}>
              {isPro && (
                <div className="absolute -top-3 left-4">
                  <span className="text-xs bg-brand-500 text-white px-3 py-1 rounded-full font-semibold">Piano attuale</span>
                </div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Pro</h2>
                  <Zap size={16} className="text-brand-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">€49</span>
                  <span className="text-dark-300 text-sm">/mese</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {PRO_FEATURES.map((f) => (
                  <li key={f} className="flex items-center gap-2 text-sm text-dark-200">
                    <Check size={14} className="text-brand-400 flex-shrink-0" />{f}
                  </li>
                ))}
              </ul>
              {isPro ? (
                isOwner ? (
                  <button onClick={handleManage} disabled={redirecting}
                    className="w-full py-2.5 border border-dark-500 text-dark-200 hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
                    <CreditCard size={15} />
                    {redirecting ? 'Reindirizzo...' : 'Gestisci abbonamento'}
                  </button>
                ) : (
                  <div className="text-xs text-center text-dark-400 py-2 bg-dark-700 rounded-lg">Gestito dal proprietario</div>
                )
              ) : (
                isOwner ? (
                  <button onClick={handleUpgrade} disabled={redirecting}
                    className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
                    <Zap size={15} />
                    {redirecting ? 'Reindirizzo...' : 'Passa al Piano Pro'}
                  </button>
                ) : (
                  <div className="text-xs text-center text-dark-400 py-2 bg-dark-700 rounded-lg">Solo il proprietario può effettuare l'upgrade</div>
                )
              )}
            </div>
          </div>
        )}

        <p className="text-xs text-dark-400 text-center mt-6">
          🔒 Pagamenti sicuri tramite Stripe · Puoi annullare in qualsiasi momento
        </p>
      </div>
    </AppLayout>
  );
}
