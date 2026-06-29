'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import FcBadge from '@/components/FcBadge';
import { menusApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { Plus, ChevronRight, TrendingUp, Package } from 'lucide-react';
import Link from 'next/link';

export default function MenusPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [menus, setMenus] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);

  useEffect(() => {
    menusApi.list().then(res => {
      setMenus(res.data || []);
      setLoading(false);
      const current = res.data?.find((m: any) => m.is_current);
      if (current) loadMenu(current.id);
    }).catch(() => setLoading(false));
  }, []);

  const loadMenu = async (id: string) => {
    try {
      const res = await menusApi.get(id);
      setSelected(res.data);
    } catch { toast.error(en ? 'Error loading menu' : 'Errore nel caricamento menu'); }
  };

  const fcColor = (pct: number) => {
    if (pct <= 0) return 'text-dark-300';
    if (pct <= 30) return 'text-green-400';
    if (pct <= 35) return 'text-yellow-400';
    return 'text-red-400';
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{en ? 'Menus' : 'Menu'}</h1>
            <p className="text-dark-200 text-sm mt-1">{en ? 'Food Cost % per dish' : 'Food Cost % per ogni piatto'}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Menu list */}
          <div className="space-y-2">
            <p className="text-xs text-dark-300 uppercase font-semibold tracking-wide px-1 mb-3">{en ? 'Your menus' : 'Tuoi menu'}</p>
            {loading ? (
              <div className="text-dark-300 text-sm text-center py-8">{en ? 'Loading...' : 'Caricamento...'}</div>
            ) : menus.length === 0 ? (
              <div className="text-dark-300 text-sm text-center py-8">{en ? 'No menu' : 'Nessun menu'}</div>
            ) : menus.map((menu: any) => (
              <button key={menu.id} onClick={() => loadMenu(menu.id)}
                className={`w-full text-left p-3 rounded-xl border transition-all ${
                  selected?.id === menu.id
                    ? 'bg-brand-600/15 border-brand-600/30 text-brand-300'
                    : 'bg-dark-800 border-dark-600 text-dark-200 hover:border-dark-500 hover:text-white'
                }`}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{menu.name}</span>
                  {menu.is_current && (
                    <span className="text-xs bg-green-500/20 text-green-400 border border-green-500/30 px-1.5 py-0.5 rounded-full">
                      {en ? 'Active' : 'Attivo'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-1 text-xs text-dark-300">
                  <span>{menu.item_count} {en ? 'dishes' : 'piatti'}</span>
                  {menu.avg_fc_pct > 0 && (
                    <span className={fcColor(parseFloat(menu.avg_fc_pct))}>
                      {en ? 'Avg FC' : 'FC medio'}: {parseFloat(menu.avg_fc_pct).toFixed(1)}%
                    </span>
                  )}
                </div>
              </button>
            ))}
          </div>

          {/* Menu detail */}
          <div className="lg:col-span-3">
            {selected ? (
              <div className="space-y-4">
                {/* Summary bar */}
                <div className="card-dark flex items-center justify-between flex-wrap gap-3">
                  <div>
                    <h2 className="text-lg font-bold text-white">{selected.name}</h2>
                    <p className="text-sm text-dark-300">{selected.location_name}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-center">
                      <p className="text-xs text-dark-300">{en ? 'Active dishes' : 'Piatti attivi'}</p>
                      <p className="text-lg font-bold text-white">{selected.items?.filter((i: any) => i.status === 'active').length}</p>
                    </div>
                    <div className="text-center">
                      <p className="text-xs text-dark-300">{en ? 'Avg FC' : 'FC medio'}</p>
                      <p className={`text-lg font-bold ${fcColor(parseFloat(selected.avg_fc_pct || 0))}`}>
                        {parseFloat(selected.avg_fc_pct || 0).toFixed(1)}%
                      </p>
                    </div>
                  </div>
                </div>

                {/* Items by category */}
                {selected.categories?.map((cat: any) => {
                  const catItems = selected.items?.filter((i: any) => i.category_id === cat.id) || [];
                  if (catItems.length === 0) return null;
                  return (
                    <div key={cat.id} className="card-dark">
                      <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wide mb-3">{cat.name}</h3>
                      <div className="space-y-1">
                        {catItems.map((item: any) => (
                          <div key={item.id} className="flex items-center justify-between py-3 border-b border-dark-700 last:border-0">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-3">
                                <span className="text-sm font-medium text-white">{item.name}</span>
                                <FcBadge value={parseFloat(item.fc_pct || 0)} />
                              </div>
                              {item.description && (
                                <p className="text-xs text-dark-300 mt-0.5 truncate">{item.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-4 ml-4 text-right">
                              <div>
                                <p className="text-xs text-dark-300">{en ? 'Cost' : 'Costo'}</p>
                                <p className="text-sm font-medium text-white">€{parseFloat(item.cost_per_portion || 0).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-dark-300">{en ? 'Price' : 'Prezzo'}</p>
                                <p className="text-sm font-bold text-brand-400">€{parseFloat(item.price).toFixed(2)}</p>
                              </div>
                              <div>
                                <p className="text-xs text-dark-300">{en ? 'Margin' : 'Margine'}</p>
                                <p className="text-sm font-medium text-green-400">€{parseFloat(item.contribution_margin || 0).toFixed(2)}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}

                {/* Items without category */}
                {selected.items?.filter((i: any) => !i.category_id).length > 0 && (
                  <div className="card-dark">
                    <h3 className="text-sm font-semibold text-dark-300 uppercase tracking-wide mb-3">{en ? 'Other dishes' : 'Altri piatti'}</h3>
                    {selected.items.filter((i: any) => !i.category_id).map((item: any) => (
                      <div key={item.id} className="flex items-center justify-between py-2">
                        <span className="text-sm text-white">{item.name}</span>
                        <div className="flex items-center gap-4">
                          <FcBadge value={parseFloat(item.fc_pct || 0)} />
                          <span className="text-brand-400 font-bold">€{parseFloat(item.price).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="card-dark text-center py-24">
                <div className="text-5xl mb-4">🍽️</div>
                <p className="text-dark-200 font-medium">{en ? 'Select a menu' : 'Seleziona un menu'}</p>
                <p className="text-dark-300 text-sm mt-1">{en ? 'to see food cost and margins per dish' : 'per vedere food cost e margini per ogni piatto'}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
