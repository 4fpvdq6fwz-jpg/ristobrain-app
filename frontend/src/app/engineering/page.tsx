'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { calcApi, salesApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { ScatterChart, Scatter, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import clsx from 'clsx';

const QUADRANT_INFO: Record<string, { label: string; emoji: string; desc: string; descEn: string; color: string }> = {
  star:      { label: 'Star ⭐', emoji: '⭐', desc: 'Alta popolarità + Alto margine → Promuovi!', descEn: 'High popularity + high margin → Promote!', color: 'text-yellow-400 bg-yellow-500/15 border-yellow-500/30' },
  puzzle:    { label: 'Puzzle 🧩', emoji: '🧩', desc: 'Bassa popolarità + Alto margine → Migliora visibilità', descEn: 'Low popularity + high margin → Improve visibility', color: 'text-blue-400 bg-blue-500/15 border-blue-500/30' },
  plowhorse: { label: 'Plowhorse 🐎', emoji: '🐎', desc: 'Alta popolarità + Basso margine → Riduci costo', descEn: 'High popularity + low margin → Cut cost', color: 'text-orange-400 bg-orange-500/15 border-orange-500/30' },
  dog:       { label: 'Dog 🐕', emoji: '🐕', desc: 'Bassa popolarità + Basso margine → Rimuovi?', descEn: 'Low popularity + low margin → Remove?', color: 'text-red-400 bg-red-500/15 border-red-500/30' },
};

const COLORS = { star: '#eab308', puzzle: '#3b82f6', plowhorse: '#f97316', dog: '#ef4444' };

export default function EngineeringPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [periods, setPeriods] = useState<any[]>([]);
  const [periodId, setPeriodId] = useState('');
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'matrix' | 'table'>('table');

  useEffect(() => {
    salesApi.list().then(res => {
      const p = res.data || [];
      setPeriods(p);
      if (p.length > 0) setPeriodId(p[0].id);
    });
  }, []);

  useEffect(() => {
    if (!periodId) return;
    setLoading(true);
    calcApi.engineering(periodId).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => { toast.error(en ? 'Analysis error' : 'Errore analisi'); setLoading(false); });
  }, [periodId]);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{en ? 'Menu Analysis' : 'Analisi Menu'}</h1>
            <p className="text-dark-200 text-sm mt-1">Menu Engineering Matrix</p>
          </div>
          <div className="flex items-center gap-3">
            <select value={periodId} onChange={e => setPeriodId(e.target.value)} className="input-dark w-48">
              {periods.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="flex bg-dark-700 rounded-lg p-1 gap-1">
              {(['table', 'matrix'] as const).map(v => (
                <button key={v} onClick={() => setView(v)}
                  className={clsx('px-3 py-1.5 rounded text-sm transition-colors', view === v ? 'bg-dark-500 text-white' : 'text-dark-300 hover:text-white')}>
                  {v === 'table' ? (en ? 'Table' : 'Tabella') : (en ? 'Matrix' : 'Matrice')}
                </button>
              ))}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-24 text-dark-300">{en ? 'Calculating...' : 'Calcolo in corso...'}</div>
        ) : data ? (
          <>
            {/* Summary KPIs */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-5">
              {Object.entries(QUADRANT_INFO).map(([key, info]) => {
                const count = data.summary.quadrantCounts[key] || 0;
                return (
                  <div key={key} className={clsx('card-dark border text-center', info.color.split(' ').slice(1).join(' '))}>
                    <p className="text-2xl mb-1">{info.emoji}</p>
                    <p className="text-xs font-medium text-dark-200">{info.label.split(' ')[0]}</p>
                    <p className="text-2xl font-bold text-white">{count}</p>
                    <p className="text-xs text-dark-300">{en ? 'dishes' : 'piatti'}</p>
                  </div>
                );
              })}
            </div>

            {view === 'table' ? (
              <div className="card-dark overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-dark-600">
                      <th className="text-left py-3 px-4 text-dark-200 font-medium">{en ? 'Dish' : 'Piatto'}</th>
                      <th className="text-right py-3 px-4 text-dark-200 font-medium">{en ? 'Qty sold' : 'Qty venduta'}</th>
                      <th className="text-right py-3 px-4 text-dark-200 font-medium">{en ? 'Price' : 'Prezzo'}</th>
                      <th className="text-right py-3 px-4 text-dark-200 font-medium">FC%</th>
                      <th className="text-right py-3 px-4 text-dark-200 font-medium">{en ? 'Margin' : 'Margine'}</th>
                      <th className="text-right py-3 px-4 text-dark-200 font-medium">{en ? 'Total CM' : 'CM Totale'}</th>
                      <th className="text-center py-3 px-4 text-dark-200 font-medium">{en ? 'Quadrant' : 'Quadrante'}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.matrix.map((item: any, i: number) => {
                      const qi = QUADRANT_INFO[item.quadrant];
                      return (
                        <tr key={i} className="border-b border-dark-700 hover:bg-dark-700/30">
                          <td className="py-3 px-4 font-medium text-white">{item.item_name}</td>
                          <td className="py-3 px-4 text-right text-white">{item.qty_sold}</td>
                          <td className="py-3 px-4 text-right text-white">€{parseFloat(item.unit_price).toFixed(2)}</td>
                          <td className="py-3 px-4 text-right">
                            <span className={item.fc_pct <= 30 ? 'text-green-400' : item.fc_pct <= 35 ? 'text-yellow-400' : 'text-red-400'}>
                              {item.fc_pct.toFixed(1)}%
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right text-white">€{item.contribution_margin.toFixed(2)}</td>
                          <td className="py-3 px-4 text-right text-green-400">€{item.total_cm.toFixed(2)}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', qi.color)}>
                              {qi.emoji} {item.quadrant.charAt(0).toUpperCase() + item.quadrant.slice(1)}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="card-dark">
                <div className="grid grid-cols-2 gap-4 h-96">
                  {Object.entries(QUADRANT_INFO).map(([key, info]) => {
                    const items = data.matrix.filter((i: any) => i.quadrant === key);
                    return (
                      <div key={key} className={clsx('border rounded-xl p-4', info.color.split(' ').slice(1).join(' '))}>
                        <h3 className={clsx('font-bold text-sm mb-2', info.color.split(' ')[0])}>
                          {info.label}
                        </h3>
                        <p className="text-xs text-dark-300 mb-3">{en ? info.descEn : info.desc}</p>
                        <div className="space-y-1.5 overflow-y-auto max-h-32">
                          {items.map((item: any, i: number) => (
                            <div key={i} className="flex items-center justify-between text-xs">
                              <span className="text-white truncate">{item.item_name}</span>
                              <span className="text-dark-300 ml-2 whitespace-nowrap">{item.qty_sold} {en ? 'pcs' : 'pz'} · €{item.contribution_margin.toFixed(2)}</span>
                            </div>
                          ))}
                          {items.length === 0 && <p className="text-dark-400 text-xs">{en ? 'No dish in this quadrant' : 'Nessun piatto in questo quadrante'}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Summary footer */}
            <div className="grid grid-cols-3 gap-4 mt-4">
              <div className="card-dark text-center">
                <p className="text-xs text-dark-300">{en ? 'Total revenue' : 'Revenue Totale'}</p>
                <p className="text-xl font-bold text-white mt-1">€{parseFloat(data.summary.totalRevenue).toLocaleString('it-IT')}</p>
              </div>
              <div className="card-dark text-center">
                <p className="text-xs text-dark-300">{en ? 'Total CM' : 'CM Totale'}</p>
                <p className="text-xl font-bold text-green-400 mt-1">€{parseFloat(data.summary.totalCm).toLocaleString('it-IT')}</p>
              </div>
              <div className="card-dark text-center">
                <p className="text-xs text-dark-300">{en ? 'Avg FC%' : 'FC% Medio'}</p>
                <p className={`text-xl font-bold mt-1 ${data.summary.avgFcPct <= 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                  {parseFloat(data.summary.avgFcPct).toFixed(1)}%
                </p>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-24 text-dark-300">
            <div className="text-5xl mb-4">📊</div>
            <p>{en ? 'Select a period to start the analysis.' : "Seleziona un periodo per iniziare l'analisi."}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
