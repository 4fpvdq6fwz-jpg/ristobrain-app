'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { salesApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Trash2, ChevronRight } from 'lucide-react';

export default function SalesPage() {
  const [periods, setPeriods] = useState<any[]>([]);
  const [selected, setSelected] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const fetchPeriods = () => {
    salesApi.list().then(res => {
      setPeriods(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchPeriods(); }, []);

  const loadPeriod = async (id: string) => {
    if (selected?.id === id) { setSelected(null); return; }
    try {
      const res = await salesApi.get(id);
      setSelected(res.data);
    } catch { toast.error('Errore nel caricamento'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Eliminare questo periodo vendite?')) return;
    try {
      await salesApi.delete(id);
      toast.success('Periodo eliminato');
      if (selected?.id === id) setSelected(null);
      fetchPeriods();
    } catch { toast.error('Errore'); }
  };

  return (
    <AppLayout>
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Vendite</h1>
            <p className="text-dark-200 text-sm mt-1">Analisi revenue e food cost per periodo</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Nuovo periodo
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Periods list */}
          <div className="space-y-2">
            <p className="text-xs text-dark-300 uppercase font-semibold tracking-wide px-1 mb-3">Periodi</p>
            {loading ? (
              <div className="text-center text-dark-300 py-8">Caricamento...</div>
            ) : periods.length === 0 ? (
              <div className="text-center text-dark-300 py-12">
                <div className="text-4xl mb-3">📅</div>
                <p className="text-sm">Nessun periodo.</p>
                <p className="text-xs mt-1">Crea un nuovo periodo.</p>
              </div>
            ) : periods.map((p: any) => (
              <div key={p.id} onClick={() => loadPeriod(p.id)}
                className={`p-3 rounded-xl border cursor-pointer transition-all group ${
                  selected?.id === p.id
                    ? 'bg-brand-600/15 border-brand-600/30'
                    : 'bg-dark-800 border-dark-600 hover:border-dark-500'
                }`}>
                <div className="flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-medium ${selected?.id === p.id ? 'text-brand-300' : 'text-white'}`}>{p.name}</p>
                    <p className="text-xs text-dark-300 mt-0.5">{p.period_from} → {p.period_to}</p>
                    <p className="text-sm font-bold text-green-400 mt-1">
                      €{parseFloat(p.total_revenue || 0).toLocaleString('it-IT')}
                    </p>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={e => { e.stopPropagation(); handleDelete(p.id); }}
                      className="p-1 hover:bg-red-500/20 rounded text-dark-300 hover:text-red-400">
                      <Trash2 size={13} />
                    </button>
                    <ChevronRight size={14} className="text-dark-400" />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Period detail */}
          <div className="lg:col-span-2">
            {selected ? (
              <div className="space-y-4">
                <div className="card-dark">
                  <h2 className="text-base font-bold text-white mb-3">{selected.name}</h2>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-dark-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-dark-300">Revenue</p>
                      <p className="text-lg font-bold text-green-400 mt-1">€{parseFloat(selected.totals?.revenue || 0).toLocaleString('it-IT')}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-dark-300">Costo cibo</p>
                      <p className="text-lg font-bold text-white mt-1">€{parseFloat(selected.totals?.cost || 0).toLocaleString('it-IT')}</p>
                    </div>
                    <div className="bg-dark-700 rounded-lg p-3 text-center">
                      <p className="text-xs text-dark-300">FC%</p>
                      <p className={`text-lg font-bold mt-1 ${parseFloat(selected.totals?.fcPct) <= 30 ? 'text-green-400' : 'text-yellow-400'}`}>
                        {selected.totals?.fcPct}%
                      </p>
                    </div>
                  </div>
                </div>

                <div className="card-dark overflow-hidden">
                  <h3 className="text-sm font-semibold text-white mb-3">Dettaglio vendite</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-dark-600">
                        <th className="text-left py-2 px-3 text-dark-200 font-medium text-xs">Piatto</th>
                        <th className="text-right py-2 px-3 text-dark-200 font-medium text-xs">Qty</th>
                        <th className="text-right py-2 px-3 text-dark-200 font-medium text-xs">Prezzo</th>
                        <th className="text-right py-2 px-3 text-dark-200 font-medium text-xs">Revenue</th>
                        <th className="text-right py-2 px-3 text-dark-200 font-medium text-xs">FC%</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selected.lines || []).map((line: any, i: number) => (
                        <tr key={i} className="border-b border-dark-700 hover:bg-dark-700/20">
                          <td className="py-2.5 px-3 text-white">{line.item_name}</td>
                          <td className="py-2.5 px-3 text-right text-white">{line.qty_sold}</td>
                          <td className="py-2.5 px-3 text-right text-dark-200">€{parseFloat(line.unit_price).toFixed(2)}</td>
                          <td className="py-2.5 px-3 text-right text-green-400 font-medium">€{parseFloat(line.total_revenue).toLocaleString('it-IT')}</td>
                          <td className="py-2.5 px-3 text-right">
                            {parseFloat(line.fc_pct) > 0 ? (
                              <span className={parseFloat(line.fc_pct) <= 30 ? 'text-green-400' : 'text-yellow-400'}>
                                {parseFloat(line.fc_pct).toFixed(1)}%
                              </span>
                            ) : <span className="text-dark-400">N/D</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              <div className="card-dark text-center py-24">
                <div className="text-5xl mb-4">📊</div>
                <p className="text-dark-200 font-medium">Seleziona un periodo</p>
                <p className="text-dark-300 text-sm mt-1">per vedere revenue e food cost</p>
              </div>
            )}
          </div>
        </div>

        {showForm && <SalesPeriodForm onClose={() => setShowForm(false)} onSaved={fetchPeriods} />}
      </div>
    </AppLayout>
  );
}

function SalesPeriodForm({ onClose, onSaved }: any) {
  const [form, setForm] = useState({ name: '', periodFrom: '', periodTo: '', totalCovers: '', locationId: '' });
  const [loading, setLoading] = useState(false);
  const set = (k: string, v: any) => setForm(f => ({ ...f, [k]: v }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await salesApi.create({ ...form, locationId: form.locationId || undefined });
      toast.success('Periodo creato!');
      onSaved(); onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore');
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-dark-600">
          <h2 className="text-lg font-semibold text-white">Nuovo Periodo Vendite</h2>
          <button onClick={onClose} className="text-dark-300 hover:text-white">✕</button>
        </div>
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="text-xs text-dark-200 block mb-1">Nome periodo *</label>
            <input className="input-dark" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="es. Novembre 2024" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-dark-200 block mb-1">Data inizio *</label>
              <input type="date" className="input-dark" value={form.periodFrom} onChange={e => set('periodFrom', e.target.value)} required />
            </div>
            <div>
              <label className="text-xs text-dark-200 block mb-1">Data fine *</label>
              <input type="date" className="input-dark" value={form.periodTo} onChange={e => set('periodTo', e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="text-xs text-dark-200 block mb-1">Numero coperti</label>
            <input type="number" min="0" className="input-dark" value={form.totalCovers} onChange={e => set('totalCovers', e.target.value)} placeholder="847" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">Annulla</button>
            <button type="submit" disabled={loading} className="btn-primary flex-1">
              {loading ? 'Salvataggio...' : 'Crea periodo'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
