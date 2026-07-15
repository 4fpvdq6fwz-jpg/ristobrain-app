'use client';

import { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import { adminApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, CheckCircle2, Trash2, Gift } from 'lucide-react';

export default function AdminPage() {
  const [data, setData] = useState<any>(null);
  const [planEmail, setPlanEmail] = useState('');
  const [planValue, setPlanValue] = useState('business');
  const [planSaving, setPlanSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [denied, setDenied] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    adminApi.stats()
      .then((res) => setData(res.data))
      .catch((err) => {
        if (err.response?.status === 403) setDenied(true);
        else toast.error('Errore nel caricamento');
      })
      .finally(() => setLoading(false));
  }, []);

  const handleDelete = async (acc: any) => {
    if (!window.confirm(`Eliminare l'account "${acc.email}"? L'azione e reversibile dal database.`)) return;
    setDeleting(acc.id);
    try {
      await adminApi.deleteAccount(acc.id);
      setData((prev: any) => {
        const accounts = prev.accounts.filter((a: any) => a.id !== acc.id);
        return {
          ...prev,
          accounts,
          totalAccounts: accounts.length,
          activeAccounts: accounts.filter((a: any) => a.active).length,
        };
      });
      toast.success('Account eliminato');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore nell eliminazione');
    } finally {
      setDeleting(null);
    }
  };


  const assignPlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!planEmail) { toast.error('Inserisci la email'); return; }
    setPlanSaving(true);
    try {
      await adminApi.setPlan({ email: planEmail.trim(), plan: planValue });
      toast.success('Piano ' + planValue.toUpperCase() + ' assegnato');
      setPlanEmail('');
    } catch (err: any) {
      toast.error(err?.response?.data?.error || 'Impossibile assegnare il piano');
    } finally {
      setPlanSaving(false);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Users size={22} className="text-brand-400" /> Registrazioni
          </h1>
        <form onSubmit={assignPlan} className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4 my-6">
          <div className="flex items-center gap-2 text-white font-semibold"><Gift className="w-5 h-5 text-orange-400" /> Assegna piano (promo / gratis)</div>
          <p className="text-sm text-gray-400">Assegna un piano a un account senza pagamento, utile per amici e tester.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <input className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white md:col-span-2" placeholder="Email account" type="email" value={planEmail} onChange={(e) => setPlanEmail(e.target.value)} />
            <select className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" value={planValue} onChange={(e) => setPlanValue(e.target.value)}>
              <option value="free">Free</option>
              <option value="base">Base</option>
              <option value="pro">Pro</option>
              <option value="business">Business</option>
            </select>
          </div>
          <button type="submit" disabled={planSaving} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg">{planSaving ? 'Assegno...' : 'Assegna piano'}</button>
        </form>
          <p className="text-dark-200 text-sm mt-1">Panoramica degli account registrati e del loro utilizzo</p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-dark-300">Caricamento...</div>
        ) : denied ? (
          <div className="card-dark text-center py-16 text-dark-300">Accesso riservato all&apos;account master.</div>
        ) : data ? (
          <>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="card-dark">
                <p className="text-xs text-dark-300">Account registrati</p>
                <p className="text-3xl font-bold text-white mt-1">{data.totalAccounts}</p>
              </div>
              <div className="card-dark">
                <p className="text-xs text-dark-300">Account attivi (usano RistoBrain)</p>
                <p className="text-3xl font-bold text-green-400 mt-1">{data.activeAccounts}</p>
              </div>
            </div>

            <div className="card-dark overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-dark-600">
                    <th className="text-left py-3 px-3 text-dark-200 font-medium">Account</th>
                    <th className="text-left py-3 px-3 text-dark-200 font-medium">Ristorante</th>
                    <th className="text-left py-3 px-3 text-dark-200 font-medium">Registrato</th>
                    <th className="text-right py-3 px-3 text-dark-200 font-medium">Ingr.</th>
                    <th className="text-right py-3 px-3 text-dark-200 font-medium">Ric.</th>
                    <th className="text-right py-3 px-3 text-dark-200 font-medium">Menu</th>
                    <th className="text-right py-3 px-3 text-dark-200 font-medium">Vendite</th>
                    <th className="text-center py-3 px-3 text-dark-200 font-medium">Usa?</th>
                    <th className="py-3 px-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {data.accounts.map((a: any) => (
                    <tr key={a.id} className="border-b border-dark-700 last:border-0">
                      <td className="py-2.5 px-3">
                        <p className="text-white font-medium">{a.fullName}</p>
                        <p className="text-xs text-dark-400">{a.email}{a.phone ? ` · ${a.phone}` : ''}</p>
                      </td>
                      <td className="py-2.5 px-3 text-dark-200">{a.workspaceName || '—'}</td>
                      <td className="py-2.5 px-3 text-dark-300 text-xs">{a.createdAt ? new Date(a.createdAt).toLocaleDateString('it-IT') : '—'}</td>
                      <td className="py-2.5 px-3 text-right text-dark-200">{a.ingredients}</td>
                      <td className="py-2.5 px-3 text-right text-dark-200">{a.recipes}</td>
                      <td className="py-2.5 px-3 text-right text-dark-200">{a.menus}</td>
                      <td className="py-2.5 px-3 text-right text-dark-200">{a.salesPeriods}</td>
                      <td className="py-2.5 px-3 text-center">
                        {a.active
                          ? <CheckCircle2 size={16} className="text-green-400 inline" />
                          : <span className="text-dark-500">—</span>}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button onClick={() => handleDelete(a)} disabled={deleting === a.id}
                          className="text-dark-400 hover:text-red-400 transition-colors disabled:opacity-40" title="Elimina account">
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        ) : null}
      </div>
    </AppLayout>
  );
}
