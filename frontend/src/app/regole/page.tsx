'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { creativaApi } from '@/lib/api';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { Plus, Trash2, Pencil, X, Check, ScrollText, BookOpen } from 'lucide-react';

const TIPI = ['food_cost', 'pricing', 'regionale', 'formato', 'metodologia', 'abc', 'altro'];

export default function RegolePage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const [tab, setTab] = useState<'rules' | 'menus'>('rules');

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{en ? 'House rules & reference menus' : 'Regole della casa & menu di riferimento'}</h1>
          <p className="text-dark-200 text-sm mt-1">
            {en ? 'The proprietary logic the Creative Engine follows. Rules always come first; the web is only marginal inspiration.' : 'La logica proprietaria che il Motore Creatività rispetta. Le regole vengono sempre prima; il web è solo ispirazione marginale.'}
          </p>
        </div>

        <div className="flex bg-dark-700 rounded-lg p-1 gap-1 w-fit mb-5">
          <button onClick={() => setTab('rules')}
            className={`px-4 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${tab === 'rules' ? 'bg-dark-500 text-white' : 'text-dark-300 hover:text-white'}`}>
            <ScrollText size={14} /> {en ? 'House rules' : 'Regole della casa'}
          </button>
          <button onClick={() => setTab('menus')}
            className={`px-4 py-1.5 rounded text-sm flex items-center gap-2 transition-colors ${tab === 'menus' ? 'bg-dark-500 text-white' : 'text-dark-300 hover:text-white'}`}>
            <BookOpen size={14} /> {en ? 'Reference menus' : 'Menu di riferimento'}
          </button>
        </div>

        {tab === 'rules' ? <RulesPanel en={en} /> : <RefMenusPanel en={en} />}
      </div>
    </AppLayout>
  );
}

function RulesPanel({ en }: { en: boolean }) {
  const [rules, setRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ tipo: 'food_cost', contenuto: '', priorita: '1', attiva: true });
  const [saving, setSaving] = useState(false);

  const load = () => {
    creativaApi.rules().then(r => { setRules(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const reset = () => { setEditingId(null); setForm({ tipo: 'food_cost', contenuto: '', priorita: '1', attiva: true }); };

  const save = async () => {
    if (!form.contenuto.trim()) { toast.error(en ? 'Content is required' : 'Il contenuto è obbligatorio'); return; }
    setSaving(true);
    try {
      const payload = { tipo: form.tipo, contenuto: form.contenuto, priorita: parseInt(form.priorita) || 1, attiva: form.attiva };
      if (editingId) await creativaApi.updateRule(editingId, payload);
      else await creativaApi.createRule(payload);
      toast.success(en ? 'Rule saved' : 'Regola salvata');
      reset(); load();
    } catch { toast.error(en ? 'Error' : 'Errore'); } finally { setSaving(false); }
  };

  const edit = (r: any) => { setEditingId(r.id); setForm({ tipo: r.tipo, contenuto: r.contenuto, priorita: String(r.priorita), attiva: r.attiva }); };

  const toggle = async (r: any) => {
    try { await creativaApi.updateRule(r.id, { tipo: r.tipo, contenuto: r.contenuto, priorita: r.priorita, attiva: !r.attiva }); load(); }
    catch { toast.error(en ? 'Error' : 'Errore'); }
  };

  const del = async (id: string) => {
    if (!confirm(en ? 'Delete this rule?' : 'Eliminare questa regola?')) return;
    try { await creativaApi.deleteRule(id); toast.success(en ? 'Deleted' : 'Eliminata'); load(); }
    catch { toast.error(en ? 'Error' : 'Errore'); }
  };

  return (
    <div className="space-y-5">
      {/* Form */}
      <div className="card-dark border border-brand-500/30">
        <h3 className="text-sm font-semibold text-white mb-3">{editingId ? (en ? 'Edit rule' : 'Modifica regola') : (en ? 'New rule' : 'Nuova regola')}</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-dark-300 block mb-1">{en ? 'Type' : 'Tipo'}</label>
            <select className="input-dark" value={form.tipo} onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}>
              {TIPI.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-dark-300 block mb-1">{en ? 'Priority (1 = binding)' : 'Priorità (1 = vincolante)'}</label>
            <input type="number" min="1" className="input-dark" value={form.priorita} onChange={e => setForm(f => ({ ...f, priorita: e.target.value }))} />
          </div>
        </div>
        <label className="text-xs text-dark-300 block mb-1">{en ? 'Content' : 'Contenuto'}</label>
        <textarea className="input-dark h-24 resize-none" value={form.contenuto} onChange={e => setForm(f => ({ ...f, contenuto: e.target.value }))}
          placeholder={en ? 'e.g. All selling prices end in 7 (9.70 / 12.70 / 16.70).' : 'es. Tutti i prezzi di vendita finiscono in 7 (9,70 / 12,70 / 16,70).'} />
        <label className="flex items-center gap-2 text-xs text-dark-200 mt-3">
          <input type="checkbox" checked={form.attiva} onChange={e => setForm(f => ({ ...f, attiva: e.target.checked }))} /> {en ? 'Active' : 'Attiva'}
        </label>
        <div className="flex gap-2 mt-4">
          <button onClick={save} disabled={saving} className="btn-primary text-sm px-4 py-2 inline-flex items-center gap-1.5">
            <Check size={14} /> {saving ? (en ? 'Saving...' : 'Salvataggio...') : (editingId ? (en ? 'Save changes' : 'Salva modifiche') : (en ? 'Add rule' : 'Aggiungi regola'))}
          </button>
          {editingId && <button onClick={reset} className="text-sm text-dark-300 hover:text-white px-3">{en ? 'Cancel' : 'Annulla'}</button>}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-12 text-dark-300">{en ? 'Loading...' : 'Caricamento...'}</div>
      ) : rules.length === 0 ? (
        <div className="card-dark text-center py-12 text-dark-300">
          <div className="text-4xl mb-2">📏</div>
          <p>{en ? 'No rule yet. Add your first house rule above.' : 'Nessuna regola. Aggiungi la tua prima regola della casa qui sopra.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rules.map(r => (
            <div key={r.id} className={`card-dark flex items-start justify-between gap-3 ${!r.attiva ? 'opacity-50' : ''}`}>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300 border border-brand-500/30">{r.tipo}</span>
                  <span className="text-xs text-dark-400">{en ? 'priority' : 'priorità'} {r.priorita}</span>
                </div>
                <p className="text-sm text-white">{r.contenuto}</p>
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => toggle(r)} title={en ? 'Toggle active' : 'Attiva/disattiva'}
                  className={`p-1.5 rounded transition-colors ${r.attiva ? 'text-green-400 hover:bg-green-500/10' : 'text-dark-400 hover:bg-dark-600'}`}>
                  <Check size={14} />
                </button>
                <button onClick={() => edit(r)} className="p-1.5 text-dark-400 hover:text-brand-400 rounded"><Pencil size={14} /></button>
                <button onClick={() => del(r.id)} className="p-1.5 text-dark-400 hover:text-red-400 rounded"><Trash2 size={14} /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RefMenusPanel({ en }: { en: boolean }) {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ cliente: '', formato: '', contenuto: '' });
  const [saving, setSaving] = useState(false);

  const load = () => {
    creativaApi.refMenus().then(r => { setItems(r.data || []); setLoading(false); }).catch(() => setLoading(false));
  };
  useEffect(() => { load(); }, []);

  const save = async () => {
    if (!form.contenuto.trim()) { toast.error(en ? 'Content is required' : 'Il contenuto è obbligatorio'); return; }
    setSaving(true);
    try {
      await creativaApi.createRefMenu({ cliente: form.cliente, formato: form.formato, contenuto: form.contenuto });
      toast.success(en ? 'Reference menu saved' : 'Menu di riferimento salvato');
      setForm({ cliente: '', formato: '', contenuto: '' }); load();
    } catch { toast.error(en ? 'Error' : 'Errore'); } finally { setSaving(false); }
  };

  const del = async (id: string) => {
    if (!confirm(en ? 'Delete this reference menu?' : 'Eliminare questo menu di riferimento?')) return;
    try { await creativaApi.deleteRefMenu(id); toast.success(en ? 'Deleted' : 'Eliminato'); load(); }
    catch { toast.error(en ? 'Error' : 'Errore'); }
  };

  return (
    <div className="space-y-5">
      <div className="card-dark border border-brand-500/30">
        <h3 className="text-sm font-semibold text-white mb-3">{en ? 'New reference menu' : 'Nuovo menu di riferimento'}</h3>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <label className="text-xs text-dark-300 block mb-1">{en ? 'Client / restaurant' : 'Cliente / ristorante'}</label>
            <input className="input-dark" value={form.cliente} onChange={e => setForm(f => ({ ...f, cliente: e.target.value }))} placeholder={en ? 'e.g. 1000 Voglie' : 'es. 1000 Voglie'} />
          </div>
          <div>
            <label className="text-xs text-dark-300 block mb-1">{en ? 'Format' : 'Formato'}</label>
            <input className="input-dark" value={form.formato} onChange={e => setForm(f => ({ ...f, formato: e.target.value }))} placeholder={en ? 'e.g. grill / AYCE' : 'es. braceria / AYCE'} />
          </div>
        </div>
        <label className="text-xs text-dark-300 block mb-1">{en ? 'Menu (verbatim) + price/margin rationale' : 'Menu (verbatim) + razionale prezzi/margine'}</label>
        <textarea className="input-dark h-32 resize-none" value={form.contenuto} onChange={e => setForm(f => ({ ...f, contenuto: e.target.value }))}
          placeholder={en ? 'Paste the real menu with prices and the logic behind margins...' : 'Incolla il menu reale con prezzi e la logica dietro i margini...'} />
        <button onClick={save} disabled={saving} className="btn-primary text-sm px-4 py-2 mt-4 inline-flex items-center gap-1.5">
          <Plus size={14} /> {saving ? (en ? 'Saving...' : 'Salvataggio...') : (en ? 'Add reference menu' : 'Aggiungi menu di riferimento')}
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-dark-300">{en ? 'Loading...' : 'Caricamento...'}</div>
      ) : items.length === 0 ? (
        <div className="card-dark text-center py-12 text-dark-300">
          <div className="text-4xl mb-2">📖</div>
          <p>{en ? 'No reference menu yet. These real examples teach the engine your style.' : 'Nessun menu di riferimento. Questi esempi reali insegnano al motore il tuo stile.'}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map(m => (
            <div key={m.id} className="card-dark">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold text-white">{m.cliente || '—'}</span>
                  {m.formato && <span className="text-xs px-2 py-0.5 rounded-full bg-dark-600 text-dark-200">{m.formato}</span>}
                </div>
                <button onClick={() => del(m.id)} className="p-1.5 text-dark-400 hover:text-red-400 rounded"><Trash2 size={14} /></button>
              </div>
              <p className="text-xs text-dark-300 mt-2 whitespace-pre-wrap line-clamp-4">{m.contenuto}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
