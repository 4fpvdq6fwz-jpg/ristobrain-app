'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { calcApi, menusApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

export default function PricingPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [menus, setMenus] = useState<any[]>([]);
  const [menuId, setMenuId] = useState('');
  const [targetFc, setTargetFc] = useState(30);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    menusApi.list().then(res => {
      const m = res.data || [];
      setMenus(m);
      const current = m.find((x: any) => x.is_current);
      if (current) setMenuId(current.id);
    });
  }, []);

  useEffect(() => {
    if (!menuId) return;
    setLoading(true);
    calcApi.pricingSuggestions(menuId, targetFc).then(res => {
      setData(res.data);
      setLoading(false);
    }).catch(() => { toast.error(en ? 'Calculation error' : 'Errore nel calcolo'); setLoading(false); });
  }, [menuId, targetFc]);

  const actionIcon = (action: string) => {
    if (action === 'increase') return <TrendingUp size={14} className="text-green-400" />;
    if (action === 'decrease') return <TrendingDown size={14} className="text-red-400" />;
    return <Minus size={14} className="text-dark-300" />;
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{en ? 'Price Suggestions' : 'Suggerimenti Prezzi'}</h1>
          <p className="text-dark-200 text-sm mt-1">{en ? 'Optimal prices based on target food cost' : 'Prezzi ottimali basati su food cost target'}</p>
        </div>

        {/* Controls */}
        <div className="card-dark mb-5 flex flex-wrap items-center gap-5">
          <div>
            <label className="text-xs text-dark-300 block mb-1">Menu</label>
            <select value={menuId} onChange={e => setMenuId(e.target.value)} className="input-dark w-48">
              <option value="">{en ? 'Select menu...' : 'Seleziona menu...'}</option>
              {menus.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-dark-300 block mb-1">Target FC%: <strong className="text-brand-400">{targetFc}%</strong></label>
            <input type="range" min="15" max="50" step="1" value={targetFc}
              onChange={e => setTargetFc(parseInt(e.target.value))}
              className="w-48 accent-brand-500" />
            <div className="flex justify-between text-xs text-dark-400 mt-0.5">
              <span>15%</span><span>50%</span>
            </div>
          </div>
          <div className="ml-auto">
            <div className="text-xs text-dark-300">{en ? 'Legend' : 'Legenda'}</div>
            <div className="flex items-center gap-3 mt-1 text-xs">
              <span className="flex items-center gap-1 text-green-400"><TrendingUp size={12} /> {en ? 'Increase' : 'Aumenta'}</span>
              <span className="flex items-center gap-1 text-red-400"><TrendingDown size={12} /> {en ? 'Decrease' : 'Riduci'}</span>
              <span className="flex items-center gap-1 text-dark-300"><Minus size={12} /> Ok</span>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-300">{en ? 'Calculating suggestions...' : 'Calcolo suggerimenti...'}</div>
        ) : data?.suggestions?.length > 0 ? (
          <div className="card-dark overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left py-3 px-4 text-dark-200 font-medium">{en ? 'Dish' : 'Piatto'}</th>
                  <th className="text-right py-3 px-4 text-dark-200 font-medium">{en ? 'Cost/serv.' : 'Costo/porz.'}</th>
                  <th className="text-right py-3 px-4 text-dark-200 font-medium">{en ? 'Current price' : 'Prezzo attuale'}</th>
                  <th className="text-right py-3 px-4 text-dark-200 font-medium">{en ? 'Current FC%' : 'FC% attuale'}</th>
                  <th className="text-right py-3 px-4 text-dark-200 font-medium">{en ? 'Suggested price' : 'Prezzo suggerito'}</th>
                  <th className="text-right py-3 px-4 text-dark-200 font-medium">{en ? 'Difference' : 'Differenza'}</th>
                  <th className="text-center py-3 px-4 text-dark-200 font-medium">{en ? 'Action' : 'Azione'}</th>
                </tr>
              </thead>
              <tbody>
                {data.suggestions.map((item: any, i: number) => (
                  <tr key={i} className="border-b border-dark-700 hover:bg-dark-700/20">
                    <td className="py-3 px-4 font-medium text-white">{item.name}</td>
                    <td className="py-3 px-4 text-right text-dark-200">€{item.costPerPortion.toFixed(3)}</td>
                    <td className="py-3 px-4 text-right text-white">€{item.currentPrice.toFixed(2)}</td>
                    <td className="py-3 px-4 text-right">
                      <span className={item.currentFcPct <= targetFc ? 'text-green-400' : item.currentFcPct <= targetFc + 5 ? 'text-yellow-400' : 'text-red-400'}>
                        {item.currentFcPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={`font-bold ${item.action === 'ok' ? 'text-white' : item.action === 'increase' ? 'text-green-400' : 'text-red-400'}`}>
                        €{item.suggestedPrice.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={item.priceDiff > 0 ? 'text-green-400' : item.priceDiff < 0 ? 'text-red-400' : 'text-dark-300'}>
                        {item.priceDiff > 0 ? '+' : ''}{item.priceDiff.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {actionIcon(item.action)}
                        <span className={`text-xs font-medium ${
                          item.action === 'ok' ? 'text-dark-300' :
                          item.action === 'increase' ? 'text-green-400' : 'text-red-400'
                        }`}>
                          {item.action === 'ok' ? 'Ok' : item.action === 'increase' ? (en ? 'Increase' : 'Aumenta') : (en ? 'Decrease' : 'Riduci')}
                        </span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="p-4 border-t border-dark-600 text-xs text-dark-300">
              {en ? (
                <>* Suggested prices calculated to reach a food cost of <strong className="text-brand-400">{targetFc}%</strong>. Formula: Suggested price = Portion cost ÷ target FC%.</>
              ) : (
                <>* Prezzi suggeriti calcolati per raggiungere un food cost del <strong className="text-brand-400">{targetFc}%</strong>. Formula: Prezzo suggerito = Costo porzione ÷ FC% target.</>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-24 text-dark-300">
            <div className="text-5xl mb-4">💰</div>
            <p>{menuId ? (en ? 'No dish with calculated food cost.' : 'Nessun piatto con food cost calcolato.') : (en ? 'Select a menu to see the suggestions.' : 'Seleziona un menu per vedere i suggerimenti.')}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
