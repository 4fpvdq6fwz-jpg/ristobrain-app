'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import AppLayout from '@/components/AppLayout';
import { recipesApi, calcApi, ingredientsApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { Plus, Search, Copy, Trash2, Clock, ChevronDown, Pencil, X } from 'lucide-react';
import clsx from 'clsx';

/* ---------- helpers food cost ---------- */
// Costo di una riga: quantità (in unità ricetta) / fattore conversione * prezzo acquisto * (1 + scarto%)
function lineCost(ing: any, qty: number): number {
  if (!ing) return 0;
  const price = parseFloat(ing.current_price || 0);
  const conv = parseFloat(ing.conversion_factor || 0);
  const waste = parseFloat(ing.waste_pct || 0);
  if (!conv || !price) return 0;
  return (qty / conv) * price * (1 + waste / 100);
}

export default function RecipesPage() {
  return (
    <Suspense fallback={null}>
      <RecipesPageInner />
    </Suspense>
  );
}

function RecipesPageInner() {
  const { lang } = useLang();
  const en = lang === 'en';
  const searchParams = useSearchParams();

  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);
  const [calcData, setCalcData] = useState<any>(null);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  useEffect(() => { fetchData(); }, [search]);

  // Apertura diretta del form da "+ Azione rapida" (link /recipes?new=1)
  useEffect(() => {
    if (searchParams.get('new') === '1') {
      setEditing(null);
      setShowForm(true);
      if (typeof window !== 'undefined') window.history.replaceState({}, '', '/recipes');
    }
  }, [searchParams]);

  const fetchData = async () => {
    try {
      const [r, c, i] = await Promise.all([
        recipesApi.list(search ? { search } : undefined),
        recipesApi.categories(),
        ingredientsApi.list(),
      ]);
      setItems(r.data);
      setCategories(c.data);
      setIngredients(i.data);
    } catch {
      toast.error(en ? 'Loading error' : 'Errore nel caricamento');
    } finally { setLoading(false); }
  };

  const toggleRecipe = async (recipe: any) => {
    if (openId === recipe.id) { setOpenId(null); setCalcData(null); return; }
    setOpenId(recipe.id);
    setCalcData(null);
    try {
      const res = await calcApi.recipe(recipe.id);
      setCalcData(res.data);
    } catch { toast.error(en ? 'Food cost error' : 'Errore nel calcolo'); }
  };

  const handleEdit = async (recipe: any) => {
    try {
      const res = await recipesApi.get(recipe.id);
      setEditing(res.data);
      setShowForm(true);
    } catch { toast.error(en ? 'Error' : 'Errore'); }
  };

  const handleClone = async (id: string, name: string) => {
    if (!confirm(en ? `Duplicate "${name}"?` : `Duplicare "${name}"?`)) return;
    try {
      await recipesApi.clone(id);
      toast.success(en ? 'Recipe duplicated' : 'Ricetta duplicata');
      fetchData();
    } catch (err: any) { toast.error(err.response?.data?.error || (en ? 'Error' : 'Errore')); }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(en ? `Delete "${name}"?` : `Eliminare "${name}"?`)) return;
    try {
      await recipesApi.delete(id);
      toast.success(en ? 'Recipe deleted' : 'Ricetta eliminata');
      if (openId === id) { setOpenId(null); setCalcData(null); }
      fetchData();
    } catch { toast.error(en ? 'Error' : 'Errore'); }
  };

  // Categorie ordinate come arrivano dal backend (sort_order), poi le ricette senza categoria
  const sections = [
    ...categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      accent: true,
      recipes: items.filter((r: any) => r.category_id === cat.id),
    })),
    {
      id: '__none__',
      name: en ? 'Uncategorized' : 'Senza categoria',
      accent: false,
      recipes: items.filter((r: any) => !r.category_id),
    },
  ].filter((s) => s.recipes.length > 0);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6 gap-3">
          <div>
            <h1 className="text-2xl font-bold text-white">{en ? 'Recipes' : 'Ricette'}</h1>
            <p className="text-dark-200 text-sm mt-1">
              {items.length} {en ? 'recipes with live food cost' : 'ricette con food cost live'}
            </p>
          </div>
          <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary flex items-center gap-2 shrink-0">
            <Plus size={16} /> {en ? 'New recipe' : 'Nuova ricetta'}
          </button>
        </div>

        <div className="relative max-w-xs mb-5">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-dark-300" />
          <input value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder={en ? 'Search recipe...' : 'Cerca ricetta...'} className="input-dark pl-9" />
        </div>

        {loading ? (
          <div className="text-center py-16 text-dark-300">{en ? 'Loading...' : 'Caricamento...'}</div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-dark-300">
            <div className="text-5xl mb-3">📋</div>
            <p>{en ? 'No recipe yet.' : 'Nessuna ricetta ancora.'}</p>
            <button onClick={() => { setEditing(null); setShowForm(true); }} className="btn-primary mt-4 inline-flex items-center gap-2">
              <Plus size={16} /> {en ? 'Create the first one' : 'Crea la prima'}
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            {sections.map((sec) => (
              <div key={sec.id}>
                <h3 className={clsx(
                  'text-xs font-bold mb-2 uppercase tracking-wider px-1',
                  sec.accent ? 'text-brand-400' : 'text-dark-400'
                )}>
                  {sec.name} <span className="text-dark-400 font-medium">· {sec.recipes.length}</span>
                </h3>
                <div className="space-y-2">
                  {sec.recipes.map((recipe: any) => (
                    <RecipeCard
                      key={recipe.id}
                      recipe={recipe}
                      en={en}
                      open={openId === recipe.id}
                      calcData={openId === recipe.id ? calcData : null}
                      onToggle={() => toggleRecipe(recipe)}
                      onEdit={() => handleEdit(recipe)}
                      onClone={() => handleClone(recipe.id, recipe.name)}
                      onDelete={() => handleDelete(recipe.id, recipe.name)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {showForm && (
          <RecipeFormModal
            categories={categories}
            ingredients={ingredients}
            editing={editing}
            en={en}
            onClose={() => { setShowForm(false); setEditing(null); }}
            onSaved={() => { fetchData(); if (openId) { setOpenId(null); setCalcData(null); } }}
          />
        )}
      </div>
    </AppLayout>
  );
}

/* ================= Riga ricetta con dettaglio inline ================= */
function RecipeCard({ recipe, en, open, calcData, onToggle, onEdit, onClone, onDelete }: any) {
  const fc = recipe.food_cost_pct != null ? parseFloat(recipe.food_cost_pct) : null;
  const cpp = recipe.cost_per_portion != null ? parseFloat(recipe.cost_per_portion) : null;

  return (
    <div className={clsx(
      'card-dark !p-0 overflow-hidden transition-all',
      open && 'border-brand-500/50'
    )}>
      {/* Riga cliccabile */}
      <div
        onClick={onToggle}
        className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-dark-700/50 transition-colors"
      >
        <ChevronDown size={16} className={clsx('text-dark-300 transition-transform shrink-0', open && 'rotate-180 text-brand-400')} />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-white truncate">{recipe.name}</p>
          <p className="text-xs text-dark-300 mt-0.5">
            {recipe.yield_portions} {en ? 'servings' : 'porzioni'}
            {cpp != null && cpp > 0 && <> · €{cpp.toFixed(2)}/{en ? 'serving' : 'porz'}</>}
          </p>
        </div>
        {fc != null && fc > 0 && (
          <span className={clsx(
            'text-xs font-bold px-2 py-1 rounded-lg shrink-0',
            fc <= 30 ? 'bg-green-500/15 text-green-400' : fc <= 40 ? 'bg-yellow-500/15 text-yellow-400' : 'bg-red-500/15 text-red-400'
          )}>
            FC {fc.toFixed(1)}%
          </span>
        )}
        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button onClick={onEdit} title={en ? 'Edit' : 'Modifica'} className="p-1.5 text-dark-300 hover:text-brand-400 transition-colors"><Pencil size={14} /></button>
          <button onClick={onClone} title={en ? 'Duplicate' : 'Duplica'} className="p-1.5 text-dark-300 hover:text-white transition-colors"><Copy size={14} /></button>
          <button onClick={onDelete} title={en ? 'Delete' : 'Elimina'} className="p-1.5 text-dark-300 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
        </div>
      </div>

      {/* Dettaglio espanso, subito sotto la ricetta */}
      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-dark-600 bg-dark-700/30 animate-fadeup">
          {!calcData ? (
            <p className="text-sm text-dark-300 py-4 text-center">{en ? 'Calculating...' : 'Calcolo in corso...'}</p>
          ) : (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 my-3">
                <div className="bg-dark-800 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-dark-300">{en ? 'Cost/serving' : 'Costo/porzione'}</p>
                  <p className="text-base font-bold text-white mt-0.5">€{parseFloat(calcData.summary.costPerPortion).toFixed(2)}</p>
                </div>
                <div className="bg-dark-800 rounded-xl p-3 text-center">
                  <p className="text-[11px] text-dark-300">{en ? 'Total cost' : 'Costo totale'}</p>
                  <p className="text-base font-bold text-white mt-0.5">€{parseFloat(calcData.summary.totalCost).toFixed(2)}</p>
                </div>
                <div className="bg-dark-800 rounded-xl p-3 text-center col-span-2 sm:col-span-1">
                  <p className="text-[11px] text-dark-300">{en ? 'Time' : 'Tempo'}</p>
                  <p className="text-base font-bold text-white mt-0.5 flex items-center justify-center gap-1">
                    <Clock size={13} />
                    {(calcData.recipe?.prep_time_min || 0) + (calcData.recipe?.cook_time_min || 0)}′
                  </p>
                </div>
              </div>

              <p className="text-[11px] font-bold text-dark-300 uppercase tracking-wider mb-1.5">
                {en ? 'Ingredients per serving' : 'Ingredienti per porzione'}
              </p>
              {calcData.items.length === 0 ? (
                <div className="text-sm text-dark-300 py-3 text-center bg-dark-800 rounded-xl">
                  {en ? 'No ingredients yet.' : 'Nessun ingrediente inserito.'}{' '}
                  <button onClick={onEdit} className="text-brand-400 font-semibold hover:underline">
                    {en ? 'Add them now' : 'Aggiungili ora'}
                  </button>
                </div>
              ) : (
                <div className="space-y-0.5">
                  {calcData.items.map((item: any, i: number) => {
                    const portions = calcData.summary.yieldPortions || 1;
                    const perPortion = parseFloat(item.quantity || 0) / portions;
                    const costPerPortion = parseFloat(item.line_cost || 0) / portions;
                    return (
                      <div key={i} className="flex items-center justify-between py-1.5 border-b border-dark-700 last:border-0 text-sm">
                        <span className="text-white truncate mr-2">{item.ingredient_name}</span>
                        <span className="text-dark-200 shrink-0 tabular-nums">
                          {perPortion.toFixed(perPortion < 1 ? 2 : 0)} {item.recipe_unit || item.unit}
                          <span className="text-brand-400 font-semibold ml-3">€{costPerPortion.toFixed(2)}</span>
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

/* ================= Form ricetta con ingredienti ================= */
function RecipeFormModal({ categories, ingredients, editing, onClose, onSaved, en }: any) {
  const isEdit = !!editing;
  const portions = editing?.yield_portions || 1;

  const [form, setForm] = useState({
    name: editing?.name || '',
    categoryId: editing?.category_id || '',
    yieldPortions: portions,
    prepTimeMin: editing?.prep_time_min || 0,
    cookTimeMin: editing?.cook_time_min || 0,
    description: editing?.description || '',
  });

  // Le righe usano il PESO A PORZIONE. Al salvataggio moltiplico per le porzioni.
  const [rows, setRows] = useState<any[]>(
    editing?.items?.length
      ? editing.items.map((it: any) => ({
          ingredientId: it.ingredient_id,
          qtyPerPortion: String(+(parseFloat(it.quantity || 0) / (portions || 1)).toFixed(3)),
        }))
      : [{ ingredientId: '', qtyPerPortion: '' }]
  );
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm((f) => ({ ...f, [k]: v }));

  const setRow = (i: number, k: string, v: any) =>
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, [k]: v } : r)));
  const addRow = () => setRows((rs) => [...rs, { ingredientId: '', qtyPerPortion: '' }]);
  const removeRow = (i: number) => setRows((rs) => (rs.length === 1 ? rs : rs.filter((_, idx) => idx !== i)));

  const ingById = (id: string) => ingredients.find((x: any) => x.id === id);

  // Costo per porzione live
  const costPerPortion = rows.reduce((sum, r) => {
    const q = parseFloat(String(r.qtyPerPortion).replace(',', '.')) || 0;
    return sum + lineCost(ingById(r.ingredientId), q);
  }, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const yieldP = parseInt(String(form.yieldPortions)) || 1;
    const items = rows
      .filter((r) => r.ingredientId && parseFloat(String(r.qtyPerPortion).replace(',', '.')) > 0)
      .map((r) => {
        const ing = ingById(r.ingredientId);
        const perPortion = parseFloat(String(r.qtyPerPortion).replace(',', '.'));
        return {
          ingredientId: r.ingredientId,
          quantity: +(perPortion * yieldP).toFixed(4), // quantità totale ricetta
          unit: ing?.recipe_unit || 'g',
          itemType: 'ingredient',
        };
      });

    setLoading(true);
    try {
      const payload = { ...form, yieldPortions: yieldP, items };
      if (isEdit) {
        await recipesApi.update(editing.id, payload);
        toast.success(en ? 'Recipe updated!' : 'Ricetta aggiornata!');
      } else {
        await recipesApi.create(payload);
        toast.success(en ? 'Recipe created!' : 'Ricetta creata!');
      }
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || (en ? 'Error' : 'Errore'));
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-start sm:items-center justify-center z-50 p-3 overflow-y-auto">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-2xl my-4 shadow-card">
        <div className="flex items-center justify-between p-5 border-b border-dark-600 sticky top-0 bg-dark-800 rounded-t-2xl z-10">
          <h2 className="text-lg font-semibold text-white">
            {isEdit ? (en ? 'Edit recipe' : 'Modifica ricetta') : (en ? 'New recipe' : 'Nuova ricetta')}
          </h2>
          <button onClick={onClose} className="text-dark-300 hover:text-white"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          <div>
            <label className="text-xs text-dark-200 block mb-1">{en ? 'Recipe name *' : 'Nome ricetta *'}</label>
            <input className="input-dark" value={form.name} onChange={(e) => set('name', e.target.value)} required
              placeholder={en ? 'e.g. Truffle Risotto' : 'es. Risotto al Tartufo'} />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="col-span-2 lg:col-span-1">
              <label className="text-xs text-dark-200 block mb-1">{en ? 'Category' : 'Categoria'}</label>
              <select className="input-dark" value={form.categoryId} onChange={(e) => set('categoryId', e.target.value)}>
                <option value="">{en ? 'None' : 'Nessuna'}</option>
                {categories.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">{en ? 'Servings' : 'Porzioni'}</label>
              <input type="number" min="1" className="input-dark" value={form.yieldPortions}
                onChange={(e) => set('yieldPortions', e.target.value)} />
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">{en ? 'Prep (min)' : 'Prep (min)'}</label>
              <input type="number" min="0" className="input-dark" value={form.prepTimeMin}
                onChange={(e) => set('prepTimeMin', parseInt(e.target.value) || 0)} />
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">{en ? 'Cooking (min)' : 'Cottura (min)'}</label>
              <input type="number" min="0" className="input-dark" value={form.cookTimeMin}
                onChange={(e) => set('cookTimeMin', parseInt(e.target.value) || 0)} />
            </div>
          </div>

          {/* ---------- Ingredienti: peso a porzione ---------- */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold text-dark-200 uppercase tracking-wider">
                {en ? 'Ingredients (per serving)' : 'Ingredienti (dose a porzione)'}
              </label>
              <button type="button" onClick={addRow} className="text-xs text-brand-400 font-semibold hover:underline flex items-center gap-1">
                <Plus size={13} /> {en ? 'Add' : 'Aggiungi'}
              </button>
            </div>

            {ingredients.length === 0 ? (
              <p className="text-xs text-dark-300 bg-dark-700 rounded-xl p-3">
                {en
                  ? 'No ingredients in your database yet. Add them from the Ingredients section first.'
                  : 'Nessun ingrediente in archivio. Aggiungili prima dalla sezione Ingredienti.'}
              </p>
            ) : (
              <div className="space-y-2">
                {rows.map((row, i) => {
                  const ing = ingById(row.ingredientId);
                  const q = parseFloat(String(row.qtyPerPortion).replace(',', '.')) || 0;
                  const cost = lineCost(ing, q);
                  return (
                    <div key={i} className="flex items-center gap-2">
                      <select
                        className="input-dark flex-1 min-w-0"
                        value={row.ingredientId}
                        onChange={(e) => setRow(i, 'ingredientId', e.target.value)}
                      >
                        <option value="">{en ? 'Choose ingredient...' : 'Scegli ingrediente...'}</option>
                        {ingredients.map((x: any) => (
                          <option key={x.id} value={x.id}>{x.name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        inputMode="decimal"
                        className="input-dark w-20 text-right"
                        placeholder="0"
                        value={row.qtyPerPortion}
                        onChange={(e) => setRow(i, 'qtyPerPortion', e.target.value)}
                      />
                      <span className="text-xs text-dark-300 w-8 shrink-0">{ing?.recipe_unit || 'g'}</span>
                      <span className="text-xs text-brand-400 font-semibold w-16 text-right shrink-0 tabular-nums">
                        {cost > 0 ? `€${cost.toFixed(2)}` : '—'}
                      </span>
                      <button type="button" onClick={() => removeRow(i)}
                        className="text-dark-400 hover:text-red-400 shrink-0 p-1" title={en ? 'Remove' : 'Rimuovi'}>
                        <X size={15} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}

            {costPerPortion > 0 && (
              <div className="flex items-center justify-between mt-3 pt-3 border-t border-dark-600">
                <span className="text-sm font-semibold text-white">{en ? 'Cost per serving' : 'Costo per porzione'}</span>
                <span className="text-lg font-bold text-brand-400">€{costPerPortion.toFixed(2)}</span>
              </div>
            )}
          </div>

          <div>
            <label className="text-xs text-dark-200 block mb-1">{en ? 'Description' : 'Descrizione'}</label>
            <textarea className="input-dark h-16 resize-none" value={form.description}
              onChange={(e) => set('description', e.target.value)}
              placeholder={en ? 'Dish description...' : 'Descrizione del piatto...'} />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">{en ? 'Cancel' : 'Annulla'}</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading
                ? (en ? 'Saving...' : 'Salvataggio...')
                : isEdit ? (en ? 'Save changes' : 'Salva modifiche') : (en ? 'Create recipe' : 'Crea ricetta')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
