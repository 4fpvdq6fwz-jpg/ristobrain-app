'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { suppliersApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Plus, Truck, Mail, Phone } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: '', contactName: '', email: '', phone: '', notes: '' });
  const [saving, setSaving] = useState(false);

  const fetchData = () => {
    suppliersApi.list().then(res => {
      setSuppliers(res.data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await suppliersApi.create(form);
      toast.success('Fornitore aggiunto!');
      setShowForm(false);
      setForm({ name: '', contactName: '', email: '', phone: '', notes: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore');
    } finally { setSaving(false); }
  };

  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white">Fornitori</h1>
            <p className="text-dark-200 text-sm mt-1">{suppliers.length} fornitori registrati</p>
          </div>
          <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> Aggiungi
          </button>
        </div>

        {loading ? (
          <div className="text-center py-16 text-dark-300">Caricamento...</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {suppliers.map((s: any) => (
              <div key={s.id} className="card-dark">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-dark-600 rounded-lg">
                    <Truck size={18} className="text-dark-200" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white">{s.name}</h3>
                    {s.contact_name && <p className="text-sm text-dark-300 mt-0.5">{s.contact_name}</p>}
                    <div className="flex flex-wrap gap-3 mt-2 text-xs text-dark-400">
                      {s.email && (
                        <span className="flex items-center gap-1"><Mail size={11} />{s.email}</span>
                      )}
                      {s.phone && (
                        <span className="flex items-center gap-1"><Phone size={11} />{s.phone}</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {suppliers.length === 0 && (
              <div className="col-span-2 text-center py-16 text-dark-300">
                <div className="text-5xl mb-3">🚚</div>
                <p>Nessun fornitore. Aggiungine uno!</p>
              </div>
            )}
          </div>
        )}

        {showForm && (
          <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
            <div className="bg-dark-800 border border-dark-600 rounded-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-dark-600">
                <h2 className="text-lg font-semibold text-white">Nuovo Fornitore</h2>
                <button onClick={() => setShowForm(false)} className="text-dark-300 hover:text-white">✕</button>
              </div>
              <form onSubmit={handleSubmit} className="p-5 space-y-4">
                <div>
                  <label className="text-xs text-dark-200 block mb-1">Nome azienda *</label>
                  <input className="input-dark" value={form.name} onChange={e => set('name', e.target.value)} required placeholder="Macelleria Rossi" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-dark-200 block mb-1">Contatto</label>
                    <input className="input-dark" value={form.contactName} onChange={e => set('contactName', e.target.value)} placeholder="Mario Rossi" />
                  </div>
                  <div>
                    <label className="text-xs text-dark-200 block mb-1">Telefono</label>
                    <input className="input-dark" value={form.phone} onChange={e => set('phone', e.target.value)} placeholder="+39 02..." />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-dark-200 block mb-1">Email</label>
                  <input type="email" className="input-dark" value={form.email} onChange={e => set('email', e.target.value)} placeholder="info@fornitore.it" />
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowForm(false)} className="btn-secondary flex-1">Annulla</button>
                  <button type="submit" disabled={saving} className="btn-primary flex-1">
                    {saving ? 'Salvataggio...' : 'Aggiungi'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
