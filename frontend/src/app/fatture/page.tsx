'use client';

import { useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { invoicesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Upload, FileText, Check, ArrowRight, Loader2, RotateCcw, Sparkles, FileCode } from 'lucide-react';

type Ingredient = { id: string; name: string; purchase_unit?: string };
type Row = {
  description: string;
  quantity: number | null;
  unit: string;
  unitPrice: number | null;
  matchScore: number;
  suggestedIngredientName: string | null;
  mode: 'match' | 'new' | 'skip';
  ingredientId: string;
  name: string;
  purchaseUnit: string;
  price: string;
};

export default function FatturePage() {
  const [step, setStep] = useState<'upload' | 'review' | 'done'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [supplier, setSupplier] = useState('');
  const [invoiceDate, setInvoiceDate] = useState('');
  const [source, setSource] = useState('');
  const [rows, setRows] = useState<Row[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [validFrom, setValidFrom] = useState('');
  const [result, setResult] = useState<{ updated: number; created: number } | null>(null);

  const handleAnalyze = async () => {
    if (!file) { toast.error('Seleziona prima un file'); return; }
    setLoading(true);
    try {
      const res = await invoicesApi.parse(file);
      const data = res.data;
      const ings: Ingredient[] = data.ingredients || [];
      setIngredients(ings);
      setSupplier(data.supplier || '');
      setInvoiceDate(data.date || '');
      setSource(data.source || '');
      setValidFrom(data.date || new Date().toISOString().slice(0, 10));
      const mapped: Row[] = (data.lines || []).map((l: any) => ({
        description: l.description,
        quantity: l.quantity,
        unit: l.unit || '',
        unitPrice: l.unitPrice,
        matchScore: l.matchScore || 0,
        suggestedIngredientName: l.suggestedIngredientName || null,
        mode: l.suggestedIngredientId ? 'match' : 'new',
        ingredientId: l.suggestedIngredientId || '',
        name: l.description,
        purchaseUnit: l.unit || 'kg',
        price: l.unitPrice != null ? String(l.unitPrice) : '',
      }));
      if (mapped.length === 0) { toast.error('Nessuna riga trovata nella fattura'); setLoading(false); return; }
      setRows(mapped);
      setStep('review');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore nella lettura della fattura');
    } finally {
      setLoading(false);
    }
  };

  const updateRow = (i: number, patch: Partial<Row>) => {
    setRows((rs) => rs.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  };

  const handleSelect = (i: number, value: string) => {
    if (value === 'skip') updateRow(i, { mode: 'skip' });
    else if (value === 'new') updateRow(i, { mode: 'new' });
    else updateRow(i, { mode: 'match', ingredientId: value });
  };

  const handleConfirm = async () => {
    const lines = rows
      .filter((r) => r.mode !== 'skip' && r.price !== '' && !isNaN(Number(r.price)))
      .map((r) =>
        r.mode === 'match'
          ? { ingredientId: r.ingredientId, price: Number(r.price) }
          : { name: r.name.trim(), purchaseUnit: r.purchaseUnit || 'kg', price: Number(r.price) }
      );
    if (lines.length === 0) { toast.error('Nessuna riga valida da salvare'); return; }
    setLoading(true);
    try {
      const res = await invoicesApi.confirm({ validFrom: validFrom || undefined, lines });
      setResult({ updated: res.data.updated || 0, created: res.data.created || 0 });
      setStep('done');
      toast.success('Prezzi aggiornati');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore nel salvataggio');
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setStep('upload'); setFile(null); setRows([]); setIngredients([]);
    setSupplier(''); setInvoiceDate(''); setResult(null);
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <FileText className="text-brand-400" size={22} /> Carica fattura
          </h1>
          <p className="text-dark-200 text-sm mt-1">
            Carica una fattura del fornitore: il sistema estrae ingredienti e prezzi in automatico.
          </p>
        </div>

        {step === 'upload' && (
          <div className="card-dark">
            <label className="block border-2 border-dashed border-dark-500 rounded-xl p-10 text-center cursor-pointer hover:border-brand-500/50 transition-colors">
              <input
                type="file"
                accept=".xml,.pdf,image/*"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Upload className="mx-auto text-dark-300 mb-3" size={32} />
              <p className="text-white font-medium">{file ? file.name : 'Scegli un file dalla fattura'}</p>
              <p className="text-xs text-dark-300 mt-1">Fattura elettronica XML, PDF oppure foto/scansione</p>
            </label>

            <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-dark-300">
              <span className="inline-flex items-center gap-1"><FileCode size={14} className="text-brand-400" /> XML FatturaPA: lettura precisa</span>
              <span className="inline-flex items-center gap-1"><Sparkles size={14} className="text-brand-400" /> PDF/foto: estrazione con AI</span>
            </div>

            <button
              onClick={handleAnalyze}
              disabled={!file || loading}
              className="btn-primary mt-5 px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-40"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
              {loading ? 'Lettura in corso...' : 'Analizza fattura'}
            </button>
          </div>
        )}

        {step === 'review' && (
          <div className="space-y-4">
            <div className="card-dark flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-xs text-dark-300">Fornitore</p>
                <p className="text-white font-semibold">{supplier || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-300">Data fattura</p>
                <p className="text-white">{invoiceDate || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-dark-300">Origine</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-brand-500/15 text-brand-300">
                  {source === 'xml' ? 'XML FatturaPA' : 'AI'}
                </span>
              </div>
              <div>
                <label className="text-xs text-dark-300 block mb-1">Prezzi validi dal</label>
                <input type="date" value={validFrom} onChange={(e) => setValidFrom(e.target.value)} className="input-dark text-sm py-1.5" />
              </div>
            </div>

            <div className="card-dark overflow-x-auto">
              <p className="text-xs text-dark-300 mb-3">
                Controlla ogni riga: associa a un ingrediente esistente, crea un nuovo ingrediente oppure ignora la riga.
              </p>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-dark-300 border-b border-dark-600">
                    <th className="py-2 pr-3 font-medium">Riga fattura</th>
                    <th className="py-2 px-3 font-medium">Q.ta</th>
                    <th className="py-2 px-3 font-medium">Ingrediente</th>
                    <th className="py-2 px-3 font-medium">Prezzo EUR</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-dark-700 align-top">
                      <td className="py-2.5 pr-3 text-white max-w-xs">{r.description}</td>
                      <td className="py-2.5 px-3 text-dark-200 whitespace-nowrap">
                        {r.quantity != null ? r.quantity : ''} {r.unit}
                      </td>
                      <td className="py-2.5 px-3 w-72">
                        <select
                          value={r.mode === 'skip' ? 'skip' : r.mode === 'new' ? 'new' : r.ingredientId}
                          onChange={(e) => handleSelect(i, e.target.value)}
                          className="input-dark text-sm py-1.5 w-full"
                        >
                          <option value="new">+ Crea nuovo ingrediente</option>
                          <option value="skip">Ignora riga</option>
                          <optgroup label="Ingredienti esistenti">
                            {ingredients.map((ing) => (
                              <option key={ing.id} value={ing.id}>{ing.name}</option>
                            ))}
                          </optgroup>
                        </select>
                        {r.mode === 'match' && r.matchScore >= 0.5 && r.suggestedIngredientName && (
                          <p className="text-xs text-brand-300 mt-1">Abbinato in automatico</p>
                        )}
                        {r.mode === 'new' && (
                          <div className="flex gap-2 mt-2">
                            <input
                              value={r.name}
                              onChange={(e) => updateRow(i, { name: e.target.value })}
                              placeholder="Nome ingrediente"
                              className="input-dark text-xs py-1.5 flex-1"
                            />
                            <input
                              value={r.purchaseUnit}
                              onChange={(e) => updateRow(i, { purchaseUnit: e.target.value })}
                              placeholder="unita"
                              className="input-dark text-xs py-1.5 w-20"
                            />
                          </div>
                        )}
                      </td>
                      <td className="py-2.5 px-3">
                        <input
                          value={r.price}
                          onChange={(e) => updateRow(i, { price: e.target.value })}
                          inputMode="decimal"
                          disabled={r.mode === 'skip'}
                          className="input-dark text-sm py-1.5 w-24 disabled:opacity-40"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handleConfirm} disabled={loading} className="btn-primary px-5 py-2.5 text-sm inline-flex items-center gap-2 disabled:opacity-40">
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Check size={16} />}
                {loading ? 'Salvataggio...' : 'Conferma e aggiorna prezzi'}
              </button>
              <button onClick={reset} className="text-sm text-dark-200 hover:text-white inline-flex items-center gap-1.5">
                <RotateCcw size={14} /> Annulla
              </button>
            </div>
          </div>
        )}

        {step === 'done' && result && (
          <div className="card-dark text-center py-10">
            <div className="w-14 h-14 rounded-full bg-green-500/15 flex items-center justify-center mx-auto mb-4">
              <Check className="text-green-400" size={28} />
            </div>
            <h2 className="text-xl font-bold text-white">Fattura importata</h2>
            <p className="text-dark-200 text-sm mt-2">
              {result.updated} prezzi aggiornati, {result.created} nuovi ingredienti creati.
            </p>
            <button onClick={reset} className="btn-primary mt-6 px-5 py-2.5 text-sm inline-flex items-center gap-2">
              <Upload size={16} /> Carica una nuova fattura
            </button>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
