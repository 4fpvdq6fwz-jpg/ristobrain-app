'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import FcBadge from '@/components/FcBadge';
import { recipesApi, calcApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { Plus, Search, Copy, Trash2, ChevronDown, ChevronRight, Clock } from 'lucide-react';

export default function RecipesPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<any>(null);
  const [calcData, setCalcData] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);

  const fetchData = () => {
    setLoading(true);
    Promise.all([
      recipesApi.list({ search }),
      recipesApi.categories(),
    ]).then(([res, cats]) => {
      setItems(res.data || []);
      setCategories(cats.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, [search]);

  const handleSelect = async (recipe: any) => {
    if (selected?.id === recipe.id) { setSelected(null); setCalcData(null); return; }
    setSelected(recipe);
    try {
      const res = await calcApi.recipe(recipe.id);
      setCalcData(res.data);
    } catch {
      setCalcData(null);
    }
  };

  const handleClone = async (id: string, name: string) => {
    try {
      await recipesApi.clone(id);
      toast.success(en ? `"${name}" duplicated!` : `"${name}" duplicata!`);
      fetchData();
    } catch { toast.error(en ? 'Error' : 'Errore'); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(en ? `Delete "${name}"?` : `Eliminare "${name}"?`)) return;
    try {
      await recipesApi.delete(id);
      toast.success(en ? 'Recipe deleted' : 'Ricetta eliminata');
      if (selected?.id === id) { setSelected(null); setCalcData(null); }
      fetchData();
    } catch { toast.error(en ? 'Error' : 'Errore'); }
  };

  const grouped = categories.reduce((acc: any, cat: any) => {
    acc[cat.id] = { ...cat, recipes: items.filter((r: any) => r.category_id === cat.id) };
    return acc;
  }, {});
  const uncategorized = items.filter((r: any) => !r.category_id);

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">{en ? 'Recipes' : 'Ricette'}</h1>
            <p className="text-dark-200 text-sm mt-1">{items.length} {en ? 'recipes with live food cost' : 'ricette con food cost live'}</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> {en ? 'New recipe' : 'Nuova ricetta'}
          </button>
        </div>

        <div className="relative max-w-xs mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={en ? 'Search recipe...' : 'Cerca ricetta...'} className="input-dark pl-9" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* List */}
          <div className="lg:col-span-3 space-y-4">
            {loading ? (
              <div className="text-center py-16 text-dark-300">{en ? 'Loading...' : 'Caricamento...'}</div>
            ) : (
              <>
                {Object.values(grouped).map((cat: any) => cat.recipes.length > 0 && (
                  <div key={cat.id} className="card-dark">
                    <h3 className="text-sm font-semibold text-brand-400 mb-3 uppercase tracking-wide">{cat.name}</h3>
                    <div className="space-y-2">
                      {cat.recipes.map((recipe: any) => (
                        <RecipeRow key={recipe.id} recipe={recipe} en={en}
                          selected={selected?.id === recipe.id}
                          onSelect={() => handleSelect(recipe)}
                          onClone={() => handleClone(recipe.id, recipe.name)}
                          onDelete={() => handleDelete(recipe.id, recipe.name)}
                        />
                      ))}
                    </div>
                  </div>
                ))}
                {uncategorized.length > 0 && (
                  <div className="card-dark">
                    <h3 className="text-sm font-semibold text-dark-300 mb-3 uppercase tracking-wide">{en ? 'Uncategorized' : 'Senza categoria'}</h3>
                    {uncategorized.map((recipe: any) => (
                      <RecipeRow key={recipe.id} recipe={recipe} en={en}
                        selected={selected?.id === recipe.id}
                        onSelect={() => handleSelect(recipe)}
                        onClone={() => handleClone(recipe.id, recipe.name)}
                        onDelete={() => handleDelete(recipe.id, recipe.name)}
                      />
                    ))}
                  </div>
                )}
                {items.length === 0 && (
                  <div className="text-center py-20 text-dark-300">
                    <div className="text-5xl mb-3">📋</div>
                    <p>{en ? 'No recipe found.' : 'Nessuna ricetta trovata.'}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Detail panel */}
          <div className="lg:col-span-2">
            {selected && calcData ? (
              <div className="card-dark sticky top-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-base font-bold text-white">{calcData.recipe.name}</h2>
                    <p className="text-xs text-dark-300 mt-1 flex items-center gap-1">
                      <Clock size={11} />
                      {(calcData.recipe.prep_time_min || 0) + (calcData.recipe.cook_time_min || 0)} {en ? 'min total' : 'min totali'}
                      · {calcData.recipe.yield_portions} {en ? 'serv.' : 'porz.'}
                    </p>
                  </div>
                  <button onClick={() => { setSelected(null); setCalcData(null); }} className="text-dark-400 hover:text-white">✕</button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-dark-300">{en ? 'Cost/serving' : 'Costo/porzione'}</p>
                    <p className="text-lg font-bold text-white mt-1">
                      €{parseFloat(calcData.summary.costPerPortion).toFixed(3)}
                    </p>
                  </div>
                  <div className="bg-dark-700 rounded-lg p-3 text-center">
                    <p className="text-xs text-dark-300">{en ? 'Total cost' : 'Costo totale'}</p>
                    <p className="text-lg font-bold text-white mt-1">
                      €{parseFloat(calcData.summary.totalCost).toFixed(2)}
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-semibold text-dark-300 uppercase tracking-wide mb-2">{en ? 'Recipe items' : 'Distinta base'}</p>
                  {calcData.items.map((item: any, i: number) => (
                    <div key={i} className="flex items-center justify-between py-2 border-b border-dark-700 last:border-0 text-sm">
                      <div>
                        <span className="text-white">{item.ingredient_name}</span>
                        <span className="text-dark-300 ml-2">{item.quantity}{item.unit}</span>
                      </div>
                      <span className="text-brand-400 font-medium">€{parseFloat(item.line_cost).toFixed(4)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card-dark text-center py-16 text-dark-300">
                <div className="text-4xl mb-3">👆</div>
                <p className="text-sm">{en ? <>Select a recipe<br />to see the food cost</> : <>Seleziona una ricetta<br />per vedere il food cost</>}</p>
              </div>
            )}
          </div>
        </div>

        {showForm && (
          <RecipeFormModal categories={categories} en={en} onClose={() => setShowForm(false)} onSaved={fetchData} />
        )}
      </div>
    </AppLayout>
  );
}

function RecipeRow({ recipe, selected, onSelect, onClone, onDelete, en }: any) {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all border ${
        selected ? 'bg-brand-600/10 border-brand-600/30' : 'hover:bg-dark-700 border-transparent'
      }`}
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-white truncate">{recipe.name}</span>
          {recipe.cost_per_portion > 0 && (
            <span className="text-xs text-dark-300">€{parseFloat(recipe.cost_per_portion).toFixed(2)}</span>
          )}
        </div>
        <div className="flex items-center gap-3 mt-1 text-xs text-dark-300">
          <span>{recipe.ingredient_count || 0} {en ? 'ingredients' : 'ingredienti'}</span>
          <span>{recipe.yield_portions} {en ? 'serv.' : 'porz.'}</span>
        </div>
      </div>
      <div className="flex items-center gap-1 ml-2">
        <button onClick={(e) => { e.stopPropagation(); onClone(); }}
          className="p-1.5 hover:bg-dark-600 rounded transition-colors text-dark-300 hover:text-white">
          <Copy size={13} />
        </button>
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
          className="p-1.5 hover:bg-red-500/20 rounded transition-colors text-dark-300 hover:text-red-400">
          <Trash2 size={13} />
        </button>
        {selected ? <ChevronDown size={13} className="text-brand-400" /> : <ChevronRight size={13} className="text-dark-400" />}
      </div>
    </div>
  );
}

function RecipeFormModal({ categories, onClose, onSaved, en }: any) {
  const [form, setForm] = useState({ name: '', categoryId: '', yieldPortions: 1, prepTimeMin: 0, cookTimeMin: 0, description: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await recipesApi.create(form);
      toast.success(en ? 'Recipe created!' : 'Ricetta creata!');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || (en ? 'Error' : 'Errore'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-dark-600">
          <h2 className="text-lg font-semibold text-white">{en ? 'New Recipe' : 'Nuova Ricetta'}</h2>
          <button onClick={onClose} className="text-dark-300 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-dark-200 block mb-1">{en ? 'Recipe name *' : 'Nome ricetta *'}</label>
            <input className="input-dark" value={form.name} onChange={e => set('name', e.target.value)} required placeholder={en ? 'e.g. Truffle Risotto' : 'es. Risotto al Tartufo'} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-dark-200 block mb-1">{en ? 'Category' : 'Categoria'}</label>
              <select className="input-dark" value={form.categoryId} onChange={e => set('categoryId', e.target.value)}>
                <option value="">{en ? 'None' : 'Nessuna'}</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">{en ? 'Yield servings' : 'Porzioni resa'}</label>
              <input type="number" min="1" className="input-dark" value={form.yieldPortions} onChange={e => set('yieldPortions', parseInt(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">{en ? 'Prep (min)' : 'Prep (min)'}</label>
              <input type="number" min="0" className="input-dark" value={form.prepTimeMin} onChange={e => set('prepTimeMin', parseInt(e.target.value))} />
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">{en ? 'Cooking (min)' : 'Cottura (min)'}</label>
              <input type="number" min="0" className="input-dark" value={form.cookTimeMin} onChange={e => set('cookTimeMin', parseInt(e.target.value))} />
            </div>
          </div>
          <div>
            <label className="text-xs text-dark-200 block mb-1">{en ? 'Description' : 'Descrizione'}</label>
            <textarea className="input-dark h-20 resize-none" value={form.description} onChange={e => set('description', e.target.value)} placeholder={en ? 'Dish description...' : 'Descrizione del piatto...'} />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{en ? 'Cancel' : 'Annulla'}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? (en ? 'Saving...' : 'Salvataggio...') : (en ? 'Create recipe' : 'Crea ricetta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
