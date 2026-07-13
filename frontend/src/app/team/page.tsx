'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { teamApi } from '@/lib/api';
import toast from 'react-hot-toast';
import { Users, Trash2, UserPlus, ShieldCheck, Lock } from 'lucide-react';

type Member = { id: string; email: string; full_name: string; role: string; created_at: string };

export default function TeamPage() {
  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState('free');
  const [maxMembers, setMaxMembers] = useState(5);
  const [canManage, setCanManage] = useState(false);
  const [members, setMembers] = useState<Member[]>([]);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', role: 'member' });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await teamApi.getMembers();
      setPlan(data.plan);
      setMaxMembers(data.maxMembers);
      setCanManage(data.canManage);
      setMembers(data.members || []);
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Errore nel caricamento del team');
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => { load(); }, []);

  const isBusiness = plan === 'business';

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName || !form.email || !form.password) {
      toast.error('Compila nome, email e password');
      return;
    }
    setSaving(true);
    try {
      await teamApi.addMember(form);
      toast.success('Collaboratore aggiunto');
      setForm({ fullName: '', email: '', password: '', role: 'member' });
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Impossibile aggiungere il collaboratore');
    } finally {
      setSaving(false);
    }
  };

  const removeMember = async (id: string, name: string) => {
    if (!confirm('Rimuovere ' + name + ' dal team?')) return;
    try {
      await teamApi.removeMember(id);
      toast.success('Collaboratore rimosso');
      load();
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Impossibile rimuovere il collaboratore');
    }
  };

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3">
          <Users className="w-7 h-7 text-orange-400" />
          <h1 className="text-2xl font-bold text-white">Team</h1>
        </div>
        <p className="text-gray-400">Crea account interni per i tuoi collaboratori. Condividono lo stesso spazio di lavoro (ingredienti, ricette, menu) senza accesso a fatturazione e gestione del team.</p>

        {loading && <p className="text-gray-500">Caricamento…</p>}

        {!loading && !isBusiness && (
          <div className="bg-gray-800 border border-orange-500/30 rounded-xl p-6 text-center space-y-3">
            <Lock className="w-8 h-8 text-orange-400 mx-auto" />
            <h2 className="text-lg font-semibold text-white">La gestione del team è inclusa nel piano Business</h2>
            <p className="text-gray-400">Passa a Business per creare fino a {maxMembers} account per il tuo staff, con un unico spazio di lavoro condiviso.</p>
            <Link href="/billing" className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-lg">Passa a Business</Link>
          </div>
        )}

        {!loading && isBusiness && (
          <>
            {canManage && (
              <form onSubmit={addMember} className="bg-gray-800 border border-gray-700 rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white font-semibold"><UserPlus className="w-5 h-5 text-orange-400" /> Aggiungi collaboratore</div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <input className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Nome e cognome" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
                  <input className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Email" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
                  <input className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" placeholder="Password (min 8 caratteri)" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
                  <select className="bg-gray-900 border border-gray-700 rounded-lg px-3 py-2 text-white" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                    <option value="member">Collaboratore</option>
                    <option value="admin">Amministratore</option>
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">{members.length}/{maxMembers} account utilizzati</span>
                  <button type="submit" disabled={saving || members.length >= maxMembers} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-semibold px-4 py-2 rounded-lg">{saving ? 'Aggiungo…' : 'Aggiungi'}</button>
                </div>
              </form>
            )}

            <div className="bg-gray-800 border border-gray-700 rounded-xl divide-y divide-gray-700">
              {members.length === 0 && <p className="p-4 text-gray-500">Nessun collaboratore ancora.</p>}
              {members.map((m) => (
                <div key={m.id} className="flex items-center justify-between p-4">
                  <div>
                    <div className="text-white font-medium">{m.full_name}</div>
                    <div className="text-sm text-gray-400">{m.email}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded-full bg-gray-700 text-gray-300 flex items-center gap-1">
                      {m.role === 'owner' ? (<><ShieldCheck className="w-3 h-3" /> Titolare</>) : m.role === 'admin' ? 'Amministratore' : 'Collaboratore'}
                    </span>
                    {canManage && m.role !== 'owner' && (
                      <button onClick={() => removeMember(m.id, m.full_name)} className="text-red-400 hover:text-red-300" title="Rimuovi"><Trash2 className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
