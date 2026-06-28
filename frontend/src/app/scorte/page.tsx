'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { ingredientsApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { PackageX, Truck } from 'lucide-react';

export default function ScortePage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    ingredientsApi.restock()
      .then((res) => setItems(res.data.items || []))
      .catch(() => toast.error(en ? 'Error loading stock' : 'Errore nel caricamento delle scorte'))
      .finally(() => setLoading(false));
  }, []);

  const groups: Record<string, any[]> = {};
  items.forEach((it) => {
    const key = it.supplier_name || (en ? 'No supplier' : 'Senza fornitore');
    (groups[key] = groups[key] || []).push(it);
  });

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <PackageX size={22} className="text-brand-400" /> {en ? 'Stock & Orders' : 'Scorte & Ordini'}
          </h1>
          <p className="text-dark-200 text-sm mt-1">{en ? 'Ingredients below minimum stock, ready to order' : 'Ingredienti sotto la scorta minima, pronti da ordinare'}</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-300">{en ? 'Loading...' : 'Caricamento...'}</div>
        ) : items.length === 0 ? (
          <div className="card-dark text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-medium">{en ? 'Stock is fine' : 'Magazzino a posto'}</p>
            <p className="text-dark-300 text-sm mt-1">{en ? 'No ingredient below minimum stock.' : 'Nessun ingrediente sotto la scorta minima.'}</p>
          </div>
        ) : (
          <div className="space-y-5">
            {Object.entries(groups).map(([supplier, list]) => (
              <div key={supplier} className="card-dark">
                <h2 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
                  <Truck size={16} className="text-brand-400" /> {supplier}
                  <span className="text-xs text-dark-300 font-normal">· {list.length} {en ? 'to order' : 'da ordinare'}</span>
                </h2>
                <div className="space-y-2">
                  {list.map((it) => (
                    <div key={it.id} className="flex items-center justify-between text-sm border-b border-dark-700 last:border-0 py-2">
                      <div>
                        <p className="text-white font-medium">{it.name}</p>
                        <p className="text-xs text-dark-300">
                          {en ? 'Stock' : 'Scorta'} {parseFloat(it.stock_qty)} / min {parseFloat(it.min_stock)} {it.purchase_unit}
                        </p>
                      </div>
                      <div className="text-right whitespace-nowrap">
                        <p className="text-orange-400 font-semibold">+{parseFloat(it.to_order)} {it.purchase_unit}</p>
                        <p className="text-xs text-dark-400">{en ? 'to order' : 'da ordinare'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
