'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ingredientsApi } from '@/lib/api';
import { useLang } from './LanguageProvider';
import { Sparkles, TrendingUp, PackageX, ChevronRight, CheckCircle2 } from 'lucide-react';

export default function TodayPanel() {
  const { lang } = useLang();
  const [alerts, setAlerts] = useState<any[]>([]);
  const [restock, setRestock] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      ingredientsApi.priceAlerts(5).catch(() => ({ data: { alerts: [] } })),
      ingredientsApi.restock().catch(() => ({ data: { items: [] } })),
    ]).then(([a, r]: any[]) => {
      setAlerts((a.data && a.data.alerts) || []);
      setRestock((r.data && r.data.items) || []);
      setLoaded(true);
    });
  }, []);

  if (!loaded) return null;

  const en = lang === 'en';
  const nothing = alerts.length === 0 && restock.length === 0;

  return (
    <div className="card-dark mb-6 border border-brand-600/30">
      <div className="flex items-center gap-2 mb-3">
        <Sparkles size={18} className="text-brand-400" />
        <h2 className="text-base font-semibold text-white">{en ? 'To do today' : 'Da fare oggi'}</h2>
      </div>

      {nothing ? (
        <div className="flex items-center gap-2 text-sm text-green-400">
          <CheckCircle2 size={16} /> {en ? 'All under control. Nothing urgent today.' : 'Tutto sotto controllo. Niente di urgente oggi.'}
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 gap-2">
          {alerts.length > 0 && (
            <Link
              href="/avvisi"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-red-500/25 bg-red-500/5 hover:bg-red-500/10 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-red-500/15 flex items-center justify-center shrink-0">
                <TrendingUp size={16} className="text-red-400" />
              </span>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">
                  {alerts.length} {en ? (alerts.length === 1 ? 'price rise' : 'price rises') : (alerts.length === 1 ? 'rincaro' : 'rincari')}
                </p>
                <p className="text-xs text-dark-300">{en ? 'An ingredient is eating your margin' : 'Un ingrediente ti sta erodendo il margine'}</p>
              </div>
              <ChevronRight size={16} className="text-dark-400" />
            </Link>
          )}
          {restock.length > 0 && (
            <Link
              href="/scorte"
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg border border-orange-500/25 bg-orange-500/5 hover:bg-orange-500/10 transition-colors"
            >
              <span className="w-8 h-8 rounded-lg bg-orange-500/15 flex items-center justify-center shrink-0">
                <PackageX size={16} className="text-orange-400" />
              </span>
              <div className="flex-1">
                <p className="text-sm text-white font-medium">
                  {restock.length} {en ? 'to reorder' : 'da riordinare'}
                </p>
                <p className="text-xs text-dark-300">{en ? 'Items below minimum stock' : 'Ingredienti sotto la scorta minima'}</p>
              </div>
              <ChevronRight size={16} className="text-dark-400" />
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
