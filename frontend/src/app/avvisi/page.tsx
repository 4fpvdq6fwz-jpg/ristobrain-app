'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { ingredientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { TrendingUp, AlertTriangle, BellRing } from 'lucide-react';

export default function AvvisiPage() {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    ingredientsApi.priceAlerts(threshold)
      .then((res) => setAlerts(res.data.alerts || []))
      .catch(() => toast.error('Errore nel caricamento degli avvisi'))
      .finally(() => setLoading(false));
  }, [threshold]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <BellRing size={22} className="text-brand-400" /> Avvisi Prezzi
            </h1>
            <p className="text-dark-200 text-sm mt-1">Ingredienti con un rincaro oltre la soglia</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-dark-300">Soglia</span>
            <select value={threshold} onChange={(e) => setThreshold(parseInt(e.target.value))} className="input-dark w-28">
              <option value={3}>+3%</option>
              <option value={5}>+5%</option>
              <option value={10}>+10%</option>
              <option value={15}>+15%</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-300">Caricamento...</div>
        ) : alerts.length === 0 ? (
          <div className="card-dark text-center py-16">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-white font-medium">Nessun rincaro oltre +{threshold}%</p>
            <p className="text-dark-300 text-sm mt-1">I prezzi dei tuoi ingredienti sono sotto controllo.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-orange-400 mb-1">
              <AlertTriangle size={16} />
              {alerts.length} {alerts.length === 1 ? 'ingrediente' : 'ingredienti'} con rincaro oltre +{threshold}%
            </div>
            {alerts.map((a: any) => (
              <div key={a.id} className="card-dark flex items-center justify-between">
                <div>
                  <p className="font-medium text-white">{a.name}</p>
                  <p className="text-xs text-dark-300 mt-0.5">
                    €{parseFloat(a.previous_price).toFixed(2)} → €{parseFloat(a.current_price).toFixed(2)} / {a.purchase_unit}
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-red-400 font-semibold whitespace-nowrap">
                  <TrendingUp size={18} />
                  +{parseFloat(a.change_pct).toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
