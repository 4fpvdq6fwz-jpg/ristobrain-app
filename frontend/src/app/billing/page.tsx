'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { billingApi } from '@/lib/api';
import { getAuth } from '@/lib/auth';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { CreditCard, Zap, Check, AlertTriangle, Building2 } from 'lucide-react';

interface BillingStatus {
  plan: 'free' | 'pro' | 'business';
  subscriptionStatus: string | null;
  hasCustomer: boolean;
  expiresAt: string | null;
}

const FREE_FEATURES = ['1 locale', 'Fino a 30 ricette', 'Fino a 50 ingredienti', 'AI Consulente base'];
const FREE_FEATURES_EN = ['1 location', 'Up to 30 recipes', 'Up to 50 ingredients', 'Basic AI Advisor'];

const PRO_FEATURES = [
  'Locali illimitati',
  'Menu e ricette illimitati',
  'Motore Creatività Menu',
  'AI Consulente avanzato',
  'Analisi food cost e menu engineering',
  'Caricamento fatture (XML/PDF/AI)',
  'Supporto prioritario',
];
const PRO_FEATURES_EN = [
  'Unlimited locations',
  'Unlimited menus and recipes',
  'Creative Menu Engine',
  'Advanced AI Advisor',
  'Food cost & menu engineering analytics',
  'Invoice upload (XML/PDF/AI)',
  'Priority support',
];

const BUSINESS_FEATURES = [
  'Tutto del piano Pro',
  'Multi-ristorante con team e ruoli',
  'Report white-label brandizzati',
  'Esportazioni avanzate (PDF/Excel)',
  'Onboarding e formazione dedicati',
  'Supporto dedicato prioritario',
  'API e integrazioni',
];
const BUSINESS_FEATURES_EN = [
  'Everything in Pro',
  'Multi-restaurant with team & roles',
  'White-label branded reports',
  'Advanced exports (PDF/Excel)',
  'Dedicated onboarding & training',
  'Priority dedicated support',
  'API & integrations',
];

export default function BillingPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [status, setStatus] = useState<BillingStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [redirecting, setRedirecting] = useState<string | null>(null);
  const auth = getAuth();
  const isOwner = auth?.workspace?.role === 'owner';

  useEffect(() => {
    loadStatus();
    const params = new URLSearchParams(window.location.search);
    if (params.get('success') === '1') {
      toast.success(en ? 'Subscription activated! Welcome.' : 'Abbonamento attivato! Benvenuto.');
      window.history.replaceState({}, '', '/billing');
    }
    if (params.get('canceled') === '1') {
      toast(en ? 'Payment canceled.' : 'Pagamento annullato.', { icon: 'ℹ️' });
      window.history.replaceState({}, '', '/billing');
    }
  }, []);

  const loadStatus = async () => {
    try {
      const res = await billingApi.status();
      setStatus(res.data);
    } catch {
      toast.error(en ? 'Error loading the plan' : 'Errore nel caricamento del piano');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (plan: 'pro' | 'business') => {
    if (!isOwner) { toast.error(en ? 'Only the owner can manage the subscription' : "Solo il proprietario può gestire l'abbonamento"); return; }
    setRedirecting(plan);
    try {
      const res = await billingApi.createCheckout(plan);
      window.location.href = res.data.url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || (en ? 'Checkout error' : 'Errore nel checkout'));
      setRedirecting(null);
    }
  };

  const handleManage = async () => {
    if (!isOwner) { toast.error(en ? 'Only the owner can manage the subscription' : "Solo il proprietario può gestire l'abbonamento"); return; }
    setRedirecting('manage');
    try {
      const res = await billingApi.createPortal();
      window.location.href = res.data.url;
    } catch (err: any) {
      toast.error(err.response?.data?.error || (en ? 'Portal error' : 'Errore nel portale'));
      setRedirecting(null);
    }
  };

  const currentPlan = status?.plan || 'free';
  const isPastDue = status?.subscriptionStatus === 'past_due';

  const planLabel = (p: string) => p === 'business' ? 'Business' : p === 'pro' ? 'Pro' : 'Free';
  const currentBadge = (
    <div className="absolute -top-3 left-4">
      <span className="text-xs bg-brand-500 text-white px-3 py-1 rounded-full font-semibold">{en ? 'Current plan' : 'Piano attuale'}</span>
    </div>
  );

  const renderCta = (plan: 'pro' | 'business') => {
    if (currentPlan === plan) {
      return isOwner ? (
        <button onClick={handleManage} disabled={!!redirecting}
          className="w-full py-2.5 border border-dark-500 text-dark-200 hover:text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-40">
          <CreditCard size={15} />
          {redirecting === 'manage' ? (en ? 'Redirecting...' : 'Reindirizzo...') : (en ? 'Manage subscription' : 'Gestisci abbonamento')}
        </button>
      ) : (
        <div className="text-xs text-center text-dark-400 py-2 bg-dark-700 rounded-lg">{en ? 'Managed by the owner' : 'Gestito dal proprietario'}</div>
      );
    }
    return isOwner ? (
      <button onClick={() => handleUpgrade(plan)} disabled={!!redirecting}
        className="w-full py-2.5 bg-brand-500 hover:bg-brand-600 disabled:opacity-40 text-white text-sm font-semibold rounded-lg transition-colors flex items-center justify-center gap-2">
        <Zap size={15} />
        {redirecting === plan ? (en ? 'Redirecting...' : 'Reindirizzo...') : (en ? `Choose ${planLabel(plan)}` : `Scegli ${planLabel(plan)}`)}
      </button>
    ) : (
      <div className="text-xs text-center text-dark-400 py-2 bg-dark-700 rounded-lg">{en ? 'Only the owner can upgrade' : "Solo il proprietario può effettuare l'upgrade"}</div>
    );
  };

  const Feature = ({ f, color }: { f: string; color: string }) => (
    <li className="flex items-start gap-2 text-sm text-dark-200">
      <Check size={14} className={`${color} flex-shrink-0 mt-0.5`} />{f}
    </li>
  );

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{en ? 'Plan & Subscription' : 'Piano e Abbonamento'}</h1>
          <p className="text-dark-200 text-sm mt-1">{en ? 'Choose the plan that fits your restaurant' : 'Scegli il piano adatto al tuo ristorante'}</p>
        </div>

        {isPastDue && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertTriangle size={18} className="text-red-400 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-semibold text-red-300">{en ? 'Payment failed' : 'Pagamento non riuscito'}</p>
              <p className="text-xs text-red-400 mt-0.5">{en ? 'Update your payment method to keep your plan active.' : 'Aggiorna il metodo di pagamento per mantenere attivo il piano.'}</p>
              {isOwner && (
                <button onClick={handleManage} disabled={!!redirecting} className="mt-2 text-xs text-red-300 underline hover:text-red-200">
                  {en ? 'Update payment method →' : 'Aggiorna metodo di pagamento →'}
                </button>
              )}
            </div>
          </div>
        )}

        {loading ? (
          <div className="text-center py-16 text-dark-300">{en ? 'Loading...' : 'Caricamento...'}</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">

            {/* Free */}
            <div className={`card-dark border ${currentPlan === 'free' ? 'border-brand-500/50' : 'border-dark-600'} relative`}>
              {currentPlan === 'free' && currentBadge}
              <div className="mb-4">
                <h2 className="text-lg font-bold text-white">Free</h2>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">€0</span>
                  <span className="text-dark-300 text-sm">{en ? '/month' : '/mese'}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {(en ? FREE_FEATURES_EN : FREE_FEATURES).map((f) => <Feature key={f} f={f} color="text-dark-400" />)}
              </ul>
              {currentPlan === 'free' && <div className="text-xs text-center text-dark-400 py-2 bg-dark-700 rounded-lg">{en ? 'Current plan' : 'Piano corrente'}</div>}
            </div>

            {/* Pro */}
            <div className={`card-dark border ${currentPlan === 'pro' ? 'border-brand-500/50' : 'border-brand-600/30'} relative`}>
              {currentPlan === 'pro' ? currentBadge : (
                <div className="absolute -top-3 right-4">
                  <span className="text-xs bg-brand-600/30 text-brand-300 border border-brand-500/40 px-3 py-1 rounded-full font-semibold">{en ? 'Most popular' : 'Più scelto'}</span>
                </div>
              )}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Pro</h2>
                  <Zap size={16} className="text-brand-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">€49</span>
                  <span className="text-dark-300 text-sm">{en ? '/month' : '/mese'}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {(en ? PRO_FEATURES_EN : PRO_FEATURES).map((f) => <Feature key={f} f={f} color="text-brand-400" />)}
              </ul>
              {renderCta('pro')}
            </div>

            {/* Business */}
            <div className={`card-dark border ${currentPlan === 'business' ? 'border-brand-500/50' : 'border-dark-600'} relative`}>
              {currentPlan === 'business' && currentBadge}
              <div className="mb-4">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-white">Business</h2>
                  <Building2 size={16} className="text-brand-400" />
                </div>
                <div className="flex items-baseline gap-1 mt-1">
                  <span className="text-3xl font-bold text-white">€99</span>
                  <span className="text-dark-300 text-sm">{en ? '/month' : '/mese'}</span>
                </div>
              </div>
              <ul className="space-y-2 mb-6">
                {(en ? BUSINESS_FEATURES_EN : BUSINESS_FEATURES).map((f) => <Feature key={f} f={f} color="text-brand-400" />)}
              </ul>
              {renderCta('business')}
            </div>
          </div>
        )}

        <p className="text-xs text-dark-400 text-center mt-6">
          {en ? '🔒 Secure payments via Stripe · Cancel anytime' : '🔒 Pagamenti sicuri tramite Stripe · Puoi annullare in qualsiasi momento'}
        </p>
      </div>
    </AppLayout>
  );
}
