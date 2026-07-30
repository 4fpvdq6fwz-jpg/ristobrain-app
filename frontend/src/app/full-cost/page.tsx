'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { recipesApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import { Calculator, Info, TrendingUp } from 'lucide-react';
import clsx from 'clsx';

/* Voci di costo di struttura, mensili */
const COST_FIELDS = [
  { key: 'staff', it: 'Personale (lordo + contributi)', en: 'Staff (gross + contributions)' },
  { key: 'rent', it: 'Affitto / mutuo locale', en: 'Rent / premises' },
  { key: 'utilities', it: 'Utenze (luce, gas, acqua)', en: 'Utilities (power, gas, water)' },
  { key: 'other', it: 'Altri costi fissi (commercialista, software, assicurazioni…)', en: 'Other fixed costs (accountant, software, insurance…)' },
  { key: 'marketing', it: 'Marketing e commissioni delivery', en: 'Marketing and delivery fees' },
  { key: 'maintenance', it: 'Manutenzioni e ammortamenti', en: 'Maintenance and depreciation' },
];

const STORAGE_KEY = 'rb_fullcost_v1';

export default function FullCostPage() {
  const { lang } = useLang();
  const en = lang === 'en';

  const [costs, setCosts] = useState<Record<string, string>>({});
  const [covers, setCovers] = useState('1000');
  const [recipes, setRecipes] = useState<any[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [manualFoodCost, setManualFoodCost] = useState('');
  const [price, setPrice] = useState('');
  const [targetMargin, setTargetMargin] = useState('20');

  // Ripristina i dati salvati sul dispositivo
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const d = JSON.parse(raw);
        if (d.costs) setCosts(d.costs);
        if (d.covers) setCovers(d.covers);
        if (d.targetMargin) setTargetMargin(d.targetMargin);
      }
    } catch {}
    recipesApi.list().then((r) => setRecipes(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify({ costs, covers, targetMargin })); } catch {}
  }, [costs, covers, targetMargin]);

  const num = (v: any) => {
    const n = parseFloat(String(v ?? '').replace(',', '.'));
    return isNaN(n) ? 0 : n;
  };

  const totalFixed = COST_FIELDS.reduce((s, f) => s + num(costs[f.key]), 0);
  const coversNum = num(covers);
  const overheadPerCover = coversNum > 0 ? totalFixed / coversNum : 0;

  const selected = recipes.find((r: any) => r.id === selectedId);
  const foodCost = selectedId && selected?.cost_per_portion != null
    ? parseFloat(selected.cost_per_portion)
    : num(manualFoodCost);
  const sellPrice = selectedId && selected?.price != null && !price
    ? parseFloat(selected.price)
    : num(price);

  const fullCost = foodCost + overheadPerCover;
  const margin = sellPrice - fullCost;
  const marginPct = sellPrice > 0 ? (margin / sellPrice) * 100 : 0;
  const foodCostPct = sellPrice > 0 ? (foodCost / sellPrice) * 100 : 0;
  const targetPct = num(targetMargin);
  const minPrice = targetPct < 100 ? fullCost / (1 - targetPct / 100) : 0;

  const money = (n: number) => '€' + n.toFixed(2);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator size={22} className="text-brand-400" />
            Full Cost
          </h1>
          <p className="text-dark-200 text-sm mt-1">
            {en
              ? 'Beyond food cost: how much a dish really costs you, structure costs included.'
              : 'Oltre il food cost: quanto ti costa davvero un piatto, costi di struttura inclusi.'}
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-4 items-start">
          {/* ---------- Costi di struttura ---------- */}
          <div className="card-dark">
            <h2 className="section-title mb-1">🏛️ {en ? 'Monthly structure costs' : 'Costi di struttura mensili'}</h2>
            <p className="text-xs text-dark-300 mb-4">
              {en ? 'Everything except food and beverage purchases.' : 'Tutto tranne gli acquisti di cibo e bevande.'}
            </p>

            <div className="space-y-2.5">
              {COST_FIELDS.map((f) => (
                <div key={f.key} className="flex items-center gap-3">
                  <label className="text-sm text-dark-100 flex-1 leading-snug">{en ? f.en : f.it}</label>
                  <div className="relative shrink-0">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-300 text-sm">€</span>
                    <input
                      type="text" inputMode="decimal" placeholder="0"
                      className="input-dark w-28 pl-6 text-right"
                      value={costs[f.key] || ''}
                      onChange={(e) => setCosts((c) => ({ ...c, [f.key]: e.target.value }))}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-dark-600">
              <span className="text-sm font-semibold text-white">{en ? 'Total fixed costs' : 'Totale costi fissi'}</span>
              <span className="text-lg font-bold text-white">{money(totalFixed)}<span className="text-xs text-dark-300 font-normal">{en ? '/month' : '/mese'}</span></span>
            </div>

            <div className="mt-4 pt-4 border-t border-dark-600">
              <div className="flex items-center gap-3">
                <label className="text-sm text-dark-100 flex-1 leading-snug">
                  {en ? 'Covers served per month' : 'Coperti serviti al mese'}
                </label>
                <input
                  type="text" inputMode="numeric"
                  className="input-dark w-28 text-right"
                  value={covers}
                  onChange={(e) => setCovers(e.target.value)}
                />
              </div>
              {overheadPerCover > 0 && (
                <div className="mt-3 p-3 rounded-xl bg-brand-500/10 border border-brand-500/25">
                  <p className="text-xs text-dark-100">
                    {en ? 'Structure cost per cover' : 'Incidenza struttura per coperto'}
                  </p>
                  <p className="text-xl font-bold text-brand-400 mt-0.5">{money(overheadPerCover)}</p>
                  <p className="text-[11px] text-dark-300 mt-1">
                    {en
                      ? 'This is what every single dish must cover before making a profit.'
                      : 'È quanto ogni singolo piatto deve coprire prima di generare utile.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* ---------- Calcolo sul piatto ---------- */}
          <div className="space-y-4">
            <div className="card-dark">
              <h2 className="section-title mb-4">🍽️ {en ? 'Dish to analyse' : 'Piatto da analizzare'}</h2>

              <label className="text-xs text-dark-200 block mb-1">{en ? 'Pick a recipe' : 'Scegli una ricetta'}</label>
              <select
                className="input-dark mb-3"
                value={selectedId}
                onChange={(e) => { setSelectedId(e.target.value); setPrice(''); }}
              >
                <option value="">{en ? 'Manual entry...' : 'Inserimento manuale...'}</option>
                {recipes.map((r: any) => (
                  <option key={r.id} value={r.id}>{r.name}</option>
                ))}
              </select>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-200 block mb-1">{en ? 'Food cost / serving' : 'Food cost / porzione'}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-300 text-sm">€</span>
                    <input
                      type="text" inputMode="decimal" placeholder="0.00"
                      className="input-dark pl-6"
                      value={selectedId && selected?.cost_per_portion != null ? parseFloat(selected.cost_per_portion).toFixed(2) : manualFoodCost}
                      onChange={(e) => setManualFoodCost(e.target.value)}
                      disabled={!!selectedId && selected?.cost_per_portion != null}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-dark-200 block mb-1">{en ? 'Menu price' : 'Prezzo di vendita'}</label>
                  <div className="relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-dark-300 text-sm">€</span>
                    <input
                      type="text" inputMode="decimal" placeholder="0.00"
                      className="input-dark pl-6"
                      value={price || (selectedId && selected?.price != null ? parseFloat(selected.price).toFixed(2) : '')}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* ---------- Risultato ---------- */}
            <div className="card-dark">
              <h2 className="section-title mb-4">📊 {en ? 'Real result' : 'Risultato reale'}</h2>

              <div className="space-y-2 text-sm">
                <Row label={en ? 'Food cost' : 'Food cost'} value={money(foodCost)} sub={foodCostPct > 0 ? `${foodCostPct.toFixed(1)}%` : undefined} />
                <Row label={en ? 'Structure share' : 'Quota struttura'} value={money(overheadPerCover)} />
                <div className="flex items-center justify-between py-2.5 border-y border-dark-600 my-1">
                  <span className="font-bold text-white">{en ? 'Full cost' : 'Costo pieno'}</span>
                  <span className="font-bold text-white text-base">{money(fullCost)}</span>
                </div>
                <Row label={en ? 'Menu price' : 'Prezzo di vendita'} value={money(sellPrice)} />
              </div>

              <div className={clsx(
                'mt-4 p-4 rounded-xl border',
                sellPrice <= 0 ? 'bg-dark-700 border-dark-600'
                  : margin > 0 ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              )}>
                <p className="text-xs text-dark-100">{en ? 'Real margin per dish' : 'Margine reale per piatto'}</p>
                <p className={clsx(
                  'text-2xl font-extrabold mt-0.5',
                  sellPrice <= 0 ? 'text-dark-300' : margin > 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {sellPrice > 0 ? money(margin) : '—'}
                  {sellPrice > 0 && <span className="text-sm font-bold ml-2">({marginPct.toFixed(1)}%)</span>}
                </p>
                {sellPrice > 0 && margin <= 0 && (
                  <p className="text-xs text-red-300 mt-2">
                    {en
                      ? 'This dish is sold below its real cost: every serving loses money.'
                      : 'Questo piatto è venduto sotto il costo reale: ogni porzione genera una perdita.'}
                  </p>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-dark-600">
                <div className="flex items-center gap-3 mb-3">
                  <label className="text-sm text-dark-100 flex-1">{en ? 'Target margin' : 'Margine obiettivo'}</label>
                  <div className="relative shrink-0">
                    <input
                      type="text" inputMode="decimal"
                      className="input-dark w-20 pr-7 text-right"
                      value={targetMargin}
                      onChange={(e) => setTargetMargin(e.target.value)}
                    />
                    <span className="absolute right-2.5 top-1/2 -translate-y-1/2 text-dark-300 text-sm">%</span>
                  </div>
                </div>
                {fullCost > 0 && minPrice > 0 && (
                  <div className="p-3 rounded-xl bg-brand-500/10 border border-brand-500/25 flex items-start gap-2">
                    <TrendingUp size={16} className="text-brand-400 mt-0.5 shrink-0" />
                    <div>
                      <p className="text-xs text-dark-100">{en ? 'Suggested minimum price' : 'Prezzo minimo consigliato'}</p>
                      <p className="text-xl font-bold text-brand-400 mt-0.5">{money(minPrice)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="card-dark mt-4 flex items-start gap-3">
          <Info size={16} className="text-dark-300 mt-0.5 shrink-0" />
          <p className="text-xs text-dark-200 leading-relaxed">
            {en
              ? 'How it works: total monthly fixed costs ÷ monthly covers = structure cost each dish must absorb. Add it to the food cost and you get the full cost — the real break-even point of that dish. Figures are estimates to support your decisions, not accounting advice.'
              : 'Come funziona: costi fissi mensili ÷ coperti al mese = quota di struttura che ogni piatto deve assorbire. Sommata al food cost dà il costo pieno, cioè il vero punto di pareggio di quel piatto. I valori sono stime a supporto delle tue decisioni, non consulenza contabile.'}
          </p>
        </div>
      </div>
    </AppLayout>
  );
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-dark-100">{label}</span>
      <span className="text-white font-medium">
        {value}
        {sub && <span className="text-dark-300 text-xs ml-2">{sub}</span>}
      </span>
    </div>
  );
}
