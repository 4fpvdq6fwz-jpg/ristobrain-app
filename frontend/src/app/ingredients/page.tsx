'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { ingredientsApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Search, Edit2, Trash2, TrendingUp } from 'lucide-react';

interface Ingredient {
  id: string;
  name: string;
  code: string;
  category_name: string;
  purchase_unit: string;
  recipe_unit: string;
  waste_pct: number;
  yield_pct: number;
  current_price: number;
  supplier_name: string;
}

export default function IngredientsPage() {
  const [items, setItems] = useState<Ingredient[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<any>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      ingredientsApi.list({ search, categoryId: filterCat || undefined }),
      ingredientsApi.categories(),
    ]).then(([res, cats]) => {
      setItems(res.data || []);
      setCategories(cats.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search, filterCat]);

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Eliminare "${name}"?`)) return;
    try {
      await ingredientsApi.delete(id);
      toast.success('Ingrediente eliminato');
      fetchData();
    } catch {
      toast.error('Errore nella eliminazione');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Ingredienti</h1>
            <p className="text-dark-200 text-sm mt-1">{items.length} ingredienti nel database</p>
          </div>
          <button onClick={() => { setEditItem(null); setShowForm(true); }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Aggiungi
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-3 mb-5">
          <div className="relative flex-1 max-w-xs">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cerca ingrediente..."
              className="input-dark pl-9"
            />
          </div>
          <select value={filterCat} onChange={(e) => setFilterCat(e.target.value)} className="input-dark w-48">
            <option value="">Tutte le categorie</option>
            {categories.map((c: any) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {/* Table */}
        <div className="card-dark overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-dark-600">
                  <th className="text-left py-3 px-4 text-dark-200 font-medium">Ingrediente</th>
                  <th className="text-left py-3 px-4 text-dark-200 font-medium">Categoria</th>
                  <th className="text-right py-3 px-4 text-dark-200 font-medium">Prezzo</th>
                  <th className="text-right py-3 px-4 text-dark-200 font-medium">Sfrido %</th>
                  <th className="text-left py-3 px-4 text-dark-200 font-medium">Fornitore</th>
                  <th className="py-3 px-4"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={6} className="text-center py-16 text-dark-300">Caricamento...</td></tr>
                ) : items.length === 0 ? (
                  <tr><td colSpan={6} className="text-center py-16 text-dark-300">
                    <div className="text-4xl mb-3">🥬</div>
                    <p>Nessun ingrediente trovato.</p>
                  </td></tr>
                ) : items.map((item) => (
                  <tr key={item.id} className="border-b border-dark-700 hover:bg-dark-700/30 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-medium text-white">{item.name}</div>
                      {item.code && <div className="text-xs text-dark-300">{item.code}</div>}
                    </td>
                    <td className="py-3 px-4 text-dark-200">{item.category_name || '—'}</td>
                    <td className="py-3 px-4 text-right">
                      {item.current_price ? (
                        <span className="text-white font-medium">
                          €{parseFloat(String(item.current_price)).toFixed(2)}<span className="text-dark-300 text-xs">/{item.purchase_unit}</span>
                        </span>
                      ) : <span className="text-dark-400">N/D</span>}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <span className={item.waste_pct > 10 ? 'text-yellow-400' : 'text-dark-200'}>
                        {item.waste_pct}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-dark-200">{item.supplier_name || '—'}</td>
                    <td className="py-3 px-4">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => { setEditItem(item); setShowForm(true); }}
                          className="p-1.5 hover:bg-dark-600 rounded-lg transition-colors text-dark-300 hover:text-white">
                          <Edit2 size={14} />
                        </button>
                        <button onClick={() => handleDelete(item.id, item.name)}
                          className="p-1.5 hover:bg-red-500/20 rounded-lg transition-colors text-dark-300 hover:text-red-400">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form Modal */}
        {showForm && (
          <IngredientForm
            item={editItem}
            categories={categories}
            onClose={() => setShowForm(false)}
            onSaved={fetchData}
          />
        )}
      </div>
    </AppLayout>
  );
}

function IngredientForm({ item, categories, onClose, onSaved }: any) {
  const [form, setForm] = useState(item || {
    name: '', code: '', categoryId: '', purchaseUnit: 'kg',
    recipeUnit: 'g', conversionFactor: 1000, wastePct: 0, yieldPct: 100, currentPrice: '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (item?.id) {
        await ingredientsApi.update(item.id, form);
        toast.success('Ingrediente aggiornato');
      } else {
        await ingredientsApi.create(form);
        toast.success('Ingrediente creato');
      }
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore');
    } finally {
      setLoading(false);
    }
  };

  const set = (key: string, val: any) => setForm((f: any) => ({ ...f, [key]: val }));

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-dark-600">
          <h2 className="text-lg font-semibold text-white">{item ? 'Modifica' : 'Nuovo'} Ingrediente</h2>
          <button onClick={onClose} className="text-dark-300 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs text-dark-200 block mb-1">Nome *</label>
              <input className="input-dark" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">Codice</label>
              <input className="input-dark" value={form.code || ''} onChange={(e) => set('code', e.target.value)} placeholder="ING-001" />
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">Categoria</label>
              <select className="input-dark" value={form.categoryId || form.category_id || ''}
                onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">Nessuna</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">U.M. acquisto</label>
              <select className="input-dark" value={form.purchaseUnit || form.purchase_unit}
                onChange={(e) => set('purchaseUnit', e.target.value)}>
                {['kg', 'g', 'l', 'ml', 'pz', 'conf'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">U.M. ricetta</label>
              <select className="input-dark" value={form.recipeUnit || form.recipe_unit}
                onChange={(e) => set('recipeUnit', e.target.value)}>
                {['g', 'ml', 'pz', 'kg', 'l'].map(u => <option key={u}>{u}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">Sfrido %</label>
              <input type="number" min="0" max="100" className="input-dark"
                value={form.wastePct ?? form.waste_pct ?? 0}
                onChange={(e) => set('wastePct', parseFloat(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">Prezzo (€/UM)</label>
              <input type="number" step="0.01" min="0" className="input-dark"
                value={form.currentPrice || form.current_price || ''}
                onChange={(e) => set('currentPrice', parseFloat(e.target.value))}
                placeholder="0.00" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvataggio...' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
