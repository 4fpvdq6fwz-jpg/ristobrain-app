'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { ingredientsApi, menusApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { ShieldAlert } from 'lucide-react';

const ALLERGEN_EMOJI: Record<string, string> = {
  Glutine: '🌾', Latte: '🥛', Uova: '🥚', Pesce: '🐟', Crostacei: '🦐',
  'Frutta a guscio': '🌰', Arachidi: '🥜', Soia: '🫘', Sedano: '🌿',
  Senape: '🌭', Sesamo: '🌱', Solfiti: '🍷', Lupini: '🫛', Molluschi: '🐚',
};

export default function AllergeniPage() {
  const [menus, setMenus] = useState<any[]>([]);
  const [menuId, setMenuId] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    menusApi.list().then((res) => {
      const m = res.data || [];
      setMenus(m);
      const cur = m.find((x: any) => x.is_current) || m[0];
      if (cur) setMenuId(cur.id);
      else setLoading(false);
    }).catch(() => { toast.error('Errore nel caricamento'); setLoading(false); });
  }, []);

  useEffect(() => {
    if (!menuId) return;
    setLoading(true);
    ingredientsApi.menuAllergens(menuId)
      .then((res) => setItems(res.data.items || []))
      .catch(() => toast.error('Errore nel caricamento allergeni'))
      .finally(() => setLoading(false));
  }, [menuId]);

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <ShieldAlert size={22} className="text-brand-400" /> Allergeni
            </h1>
            <p className="text-dark-200 text-sm mt-1">Allergeni per piatto, calcolati dagli ingredienti (Reg. UE 1169/2011)</p>
          </div>
          {menus.length > 0 && (
            <select value={menuId} onChange={(e) => setMenuId(e.target.value)} className="input-dark w-56">
              {menus.map((m: any) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-300">Caricamento...</div>
        ) : items.length === 0 ? (
          <div className="card-dark text-center py-16 text-dark-300">Nessun piatto nel menu selezionato.</div>
        ) : (
          <div className="card-dark overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left py-3 px-4 text-dark-200 font-medium">Piatto</th>
                  <th className="text-left py-3 px-4 text-dark-200 font-medium">Allergeni</th>
                </tr>
              </thead>
              <tbody>
                {items.map((it: any) => (
                  <tr key={it.id} className="border-b border-dark-700 last:border-0">
                    <td className="py-3 px-4 font-medium text-white align-top">{it.name}</td>
                    <td className="py-3 px-4">
                      {(it.allergens && it.allergens.length > 0) ? (
                        <div className="flex flex-wrap gap-1.5">
                          {it.allergens.map((a: string) => (
                            <span key={a} className="text-xs px-2 py-0.5 rounded-full bg-orange-500/15 text-orange-300 border border-orange-500/30">
                              {ALLERGEN_EMOJI[a] || '⚠️'} {a}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-green-400">Nessun allergene noto</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
