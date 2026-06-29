'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { creativaApi, locationsApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { Sparkles, Loader2, Download, Globe, ChefHat } from 'lucide-react';

const STAGIONI = ['primavera', 'estate', 'autunno', 'inverno'];
const STAGIONI_EN: Record<string, string> = { primavera: 'spring', estate: 'summer', autunno: 'autumn', inverno: 'winter' };
const CATEGORIE = ['antipasti', 'primi', 'secondi', 'contorni', 'dolci'];

function fcColor(pct: number) {
  if (pct <= 0) return 'text-dark-300';
  if (pct < 28) return 'text-green-400';
  if (pct <= 35) return 'text-yellow-400';
  return 'text-red-400';
}
function fcDot(pct: number) {
  if (pct < 28) return 'bg-green-400';
  if (pct <= 35) return 'bg-yellow-400';
  return 'bg-red-400';
}
function abcColor(c: string) {
  const k = (c || '').toLowerCase();
  if (k.includes('star')) return 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30';
  if (k.includes('plow')) return 'bg-orange-500/15 text-orange-400 border-orange-500/30';
  if (k.includes('puzzle')) return 'bg-blue-500/15 text-blue-400 border-blue-500/30';
  if (k.includes('dog')) return 'bg-red-500/15 text-red-400 border-red-500/30';
  return 'bg-dark-600 text-dark-200 border-dark-500';
}

export default function CreativitaPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [restaurants, setRestaurants] = useState<any[]>([]);
  const [form, setForm] = useState<any>({
    restaurantId: '',
    tipoMenu: '',
    stagione: 'estate',
    counts: { antipasti: 2, primi: 2, secondi: 2, contorni: 0, dolci: 1 },
    ticket: '',
    ingredienti: '',
    usaWeb: false,
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    locationsApi.list().then(r => setRestaurants(r.data || [])).catch(() => {});
  }, []);

  const setF = (k: string, v: any) => setForm((f: any) => ({ ...f, [k]: v }));
  const setCount = (cat: string, v: number) => setForm((f: any) => ({ ...f, counts: { ...f.counts, [cat]: v } }));

  const onRestaurant = (id: string) => {
    setF('restaurantId', id);
    const r = restaurants.find((x) => x.id === id);
    if (r && r.ticket_target) setF('ticket', String(r.ticket_target));
  };

  const generate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const payload = {
        restaurant_id: form.restaurantId || undefined,
        tipo_menu: form.tipoMenu,
        stagione: form.stagione,
        piatti_richiesti: form.counts,
        ticket_target: form.ticket ? Number(form.ticket) : undefined,
        ingredienti: form.ingredienti.split(',').map((s: string) => s.trim()).filter(Boolean),
        usa_web: form.usaWeb,
      };
      const res = await creativaApi.generate(payload);
      setResult(res.data);
      if (res.data?.usando_default) {
        toast(en ? 'Generating with default rules — complete yours in /regole' : 'Generazione con regole di default — completa le tue in /regole', { icon: '⚠️' });
      }
    } catch (err: any) {
      toast.error(err.response?.data?.error || (en ? 'Generation error' : 'Errore nella generazione'));
    } finally {
      setLoading(false);
    }
  };

  const exportTxt = () => {
    if (!result) return;
    const lines: string[] = [];
    lines.push('RistoBrain — Menu generato\n');
    (result.menu || []).forEach((p: any) => {
      lines.push(`[${p.categoria}] ${p.nome} — €${Number(p.prezzo_suggerito).toFixed(2)}`);
      lines.push(`  ${p.descrizione}`);
      lines.push(`  Food cost: ${p.food_cost_stimato_pct}% · ABC: ${p.classificazione_abc_attesa} · ${p.fonte}`);
      lines.push(`  ${p.razionale_margine}\n`);
    });
    if (result.note_food_cost) lines.push(`Note food cost: ${result.note_food_cost}`);
    const blob = new Blob([lines.join('\n')], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `menu-ristobrain-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const grouped = CATEGORIE.map((cat) => ({
    cat,
    items: (result?.menu || []).filter((p: any) => (p.categoria || '').toLowerCase().includes(cat.slice(0, 5))),
  }));
  const ungrouped = (result?.menu || []).filter((p: any) =>
    !CATEGORIE.some((cat) => (p.categoria || '').toLowerCase().includes(cat.slice(0, 5))));

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="text-brand-400" size={22} /> {en ? 'Creative Menu Engine' : 'Motore Creatività Menu'}
          </h1>
          <p className="text-dark-200 text-sm mt-1">
            {en ? 'Creativity born inside your house rules. The web is only marginal inspiration.' : 'Creatività che nasce dentro le tue regole della casa. Il web è solo ispirazione marginale.'}
          </p>
        </div>

        {/* Form */}
        <div className="card-dark mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-dark-300 block mb-1">{en ? 'Restaurant' : 'Ristorante'}</label>
              <select className="input-dark" value={form.restaurantId} onChange={e => onRestaurant(e.target.value)}>
                <option value="">{en ? 'None / generic' : 'Nessuno / generico'}</option>
                {restaurants.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-300 block mb-1">{en ? 'Menu type / occasion' : 'Tipo menu / occasione'}</label>
              <input className="input-dark" value={form.tipoMenu} onChange={e => setF('tipoMenu', e.target.value)}
                placeholder={en ? 'e.g. fixed lunch menu, à la carte, event' : 'es. menu fisso pranzo, à la carte, evento'} />
            </div>
            <div>
              <label className="text-xs text-dark-300 block mb-1">{en ? 'Season' : 'Stagione'}</label>
              <select className="input-dark" value={form.stagione} onChange={e => setF('stagione', e.target.value)}>
                {STAGIONI.map((s) => <option key={s} value={s}>{en ? STAGIONI_EN[s] : s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-dark-300 block mb-1">{en ? 'Target price per dish (€)' : 'Ticket target per piatto (€)'}</label>
              <input type="number" className="input-dark" value={form.ticket} onChange={e => setF('ticket', e.target.value)} placeholder="9" />
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-dark-300 block mb-2">{en ? 'Dishes per category' : 'Piatti per categoria'}</label>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {CATEGORIE.map((cat) => (
                <div key={cat}>
                  <label className="text-xs text-dark-400 block mb-1 capitalize">{cat}</label>
                  <input type="number" min="0" max="10" className="input-dark text-sm py-1.5"
                    value={form.counts[cat]} onChange={e => setCount(cat, parseInt(e.target.value) || 0)} />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4">
            <label className="text-xs text-dark-300 block mb-1">{en ? 'Ingredients to feature (optional, comma-separated)' : 'Ingredienti da valorizzare (opzionale, separati da virgola)'}</label>
            <input className="input-dark" value={form.ingredienti} onChange={e => setF('ingredienti', e.target.value)}
              placeholder={en ? 'e.g. zucchini, guanciale' : 'es. zucchine, guanciale'} />
          </div>

          <div className="flex items-center justify-between mt-5 flex-wrap gap-3">
            <label className="flex items-center gap-2 text-sm text-dark-200">
              <input type="checkbox" checked={form.usaWeb} onChange={e => setF('usaWeb', e.target.checked)} />
              <Globe size={14} className="text-dark-400" /> {en ? 'Also use web inspiration' : 'Usa anche ispirazione web'}
            </label>
            <button onClick={generate} disabled={loading} className="btn-primary px-6 py-2.5 inline-flex items-center gap-2 disabled:opacity-40">
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {loading ? (en ? 'Generating...' : 'Generazione...') : (en ? 'Generate menu' : 'Genera menu')}
            </button>
          </div>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-4">
            {result.usando_default && (
              <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-xs text-yellow-300">
                {en ? 'Generated with default rules. Add your own in the Rules page for results in your style.' : 'Generato con regole di default. Aggiungi le tue nella pagina Regole per risultati nel tuo stile.'}
              </div>
            )}

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs text-dark-300">
                <ChefHat size={14} className="text-brand-400" />
                {en ? 'Sources' : 'Fonti'}: {(result.fonti_usate || []).join(', ') || 'logica_casa'}
              </div>
              <button onClick={exportTxt} className="text-sm text-dark-200 hover:text-white inline-flex items-center gap-1.5 border border-dark-500 rounded-lg px-3 py-1.5">
                <Download size={14} /> {en ? 'Export' : 'Esporta'}
              </button>
            </div>

            {grouped.map(({ cat, items }) => items.length > 0 && (
              <div key={cat}>
                <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wide mb-2 capitalize">{cat}</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {items.map((p: any, i: number) => <DishCard key={i} p={p} en={en} />)}
                </div>
              </div>
            ))}
            {ungrouped.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {ungrouped.map((p: any, i: number) => <DishCard key={i} p={p} en={en} />)}
              </div>
            )}

            {result.note_food_cost && (
              <div className="card-dark text-sm text-dark-200">
                <span className="text-dark-400 text-xs uppercase tracking-wide">{en ? 'Food cost notes' : 'Note food cost'}</span>
                <p className="mt-1">{result.note_food_cost}</p>
              </div>
            )}
          </div>
        )}

        {!result && !loading && (
          <div className="text-center py-16 text-dark-300">
            <div className="text-5xl mb-3">🧑‍🍳</div>
            <p>{en ? 'Fill the brief and generate a menu coherent with your house rules.' : 'Compila il brief e genera un menu coerente con le tue regole della casa.'}</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}

function DishCard({ p, en }: { p: any; en: boolean }) {
  const fc = Number(p.food_cost_stimato_pct) || 0;
  return (
    <div className="card-dark">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-bold text-white">{p.nome}</h4>
        <span className="text-base font-bold text-brand-400 whitespace-nowrap">€{Number(p.prezzo_suggerito).toFixed(2)}</span>
      </div>
      {p.descrizione && <p className="text-xs text-dark-300 mt-1">{p.descrizione}</p>}
      {Array.isArray(p.ingredienti_chiave) && p.ingredienti_chiave.length > 0 && (
        <p className="text-xs text-dark-400 mt-1">{p.ingredienti_chiave.join(' · ')}</p>
      )}
      <div className="flex items-center gap-2 mt-3 flex-wrap">
        <span className={`text-xs flex items-center gap-1 ${fcColor(fc)}`}>
          <span className={`w-2 h-2 rounded-full ${fcDot(fc)}`}></span> FC {fc}%
        </span>
        {p.classificazione_abc_attesa && (
          <span className={`text-xs px-2 py-0.5 rounded-full border ${abcColor(p.classificazione_abc_attesa)}`}>{p.classificazione_abc_attesa}</span>
        )}
        <span className={`text-xs px-2 py-0.5 rounded-full border ${p.fonte === 'web' ? 'bg-blue-500/15 text-blue-300 border-blue-500/30' : 'bg-brand-500/15 text-brand-300 border-brand-500/30'}`}>
          {p.fonte === 'web' ? (en ? 'web' : 'web') : (en ? 'house logic' : 'logica casa')}
        </span>
      </div>
      {p.razionale_margine && <p className="text-xs text-dark-300 mt-2 italic">{p.razionale_margine}</p>}
    </div>
  );
}
