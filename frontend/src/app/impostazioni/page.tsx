'use client';

import { useState } from 'react';
import Link from 'next/link';
import AppLayout from '@/components/AppLayout';
import { authApi } from '@/lib/api';
import { getAuth, clearAuth } from '@/lib/auth';
import { useLang } from '@/components/LanguageProvider';
import toast from 'react-hot-toast';
import { Lock, Trash2, Download, Shield, AlertTriangle, Users } from 'lucide-react';

const MASTER_EMAILS = ['chef@demo.it', 'davide.inchef@gmail.com', 'massatani.d@gmail.com'];

export default function ImpostazioniPage() {
  const { lang } = useLang();
  const en = lang === 'en';
  const auth = getAuth();
  const isMaster = !!auth?.user?.email && MASTER_EMAILS.includes(auth.user.email.toLowerCase());
  const [pwdForm, setPwdForm] = useState({ current: '', newPwd: '', confirm: '' });
  const [deletePassword, setDeletePassword] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [loading, setLoading] = useState<string | null>(null);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pwdForm.newPwd !== pwdForm.confirm) { toast.error(en ? 'The new passwords do not match' : 'Le nuove password non coincidono'); return; }
    if (pwdForm.newPwd.length < 8) { toast.error(en ? 'Password must be at least 8 characters' : 'La password deve essere di almeno 8 caratteri'); return; }
    setLoading('password');
    try {
      await authApi.changePassword(pwdForm.current, pwdForm.newPwd);
      toast.success(en ? 'Password updated' : 'Password aggiornata');
      setPwdForm({ current: '', newPwd: '', confirm: '' });
    } catch (err: any) {
      toast.error(err.response?.data?.error || (en ? 'Error changing password' : 'Errore nel cambio password'));
    } finally { setLoading(null); }
  };

  const handleExport = async () => {
    setLoading('export');
    try {
      const res = await authApi.exportData();
      const blob = new Blob([JSON.stringify(res.data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ristobrain-export-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(en ? 'Data exported successfully' : 'Dati esportati con successo');
    } catch { toast.error(en ? 'Error exporting data' : "Errore nell'esportazione dati"); }
    finally { setLoading(null); }
  };

  const handleDeleteAccount = async () => {
    if (!deletePassword) { toast.error(en ? 'Enter your password to confirm' : 'Inserisci la password per confermare'); return; }
    setLoading('delete');
    try {
      await authApi.deleteAccount(deletePassword);
      clearAuth();
      toast.success(en ? 'Account deleted' : 'Account eliminato');
      window.location.href = '/login';
    } catch (err: any) {
      toast.error(err.response?.data?.error || (en ? 'Error deleting account' : 'Errore nella cancellazione account'));
      setLoading(null);
    }
  };

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">{en ? 'Account Settings' : 'Impostazioni Account'}</h1>
          <p className="text-dark-200 text-sm mt-1">{en ? 'Manage your profile and data' : 'Gestisci il tuo profilo e i tuoi dati'}</p>
        </div>

        {/* Profilo */}
        <div className="card-dark">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Shield size={16} className="text-brand-400" /> {en ? 'Profile' : 'Profilo'}
          </h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between py-2 border-b border-dark-600">
              <span className="text-dark-300">{en ? 'Name' : 'Nome'}</span>
              <span className="text-white">{auth?.user?.fullName}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-600">
              <span className="text-dark-300">Email</span>
              <span className="text-white">{auth?.user?.email}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-dark-600">
              <span className="text-dark-300">{en ? 'Restaurant' : 'Ristorante'}</span>
              <span className="text-white">{auth?.workspace?.name}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-dark-300">{en ? 'Role' : 'Ruolo'}</span>
              <span className="text-white capitalize">{auth?.workspace?.role}</span>
            </div>
          </div>
        </div>

        {/* Pannello Master (solo account master) */}
        {isMaster && (
          <div className="card-dark border border-brand-600/30">
            <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
              <Users size={16} className="text-brand-400" /> {en ? 'Master Panel' : 'Pannello Master'}
            </h2>
            <p className="text-xs text-dark-300 mb-4">{en ? 'See how many accounts registered and how many really use RistoBrain.' : 'Vedi quanti account si sono registrati e quanti usano davvero RistoBrain.'}</p>
            <Link href="/admin" className="inline-flex items-center gap-2 text-sm bg-brand-500 hover:bg-brand-600 text-white px-4 py-2 rounded-lg font-medium transition-colors">
              <Users size={15} /> {en ? 'Registration stats' : 'Statistiche registrazioni'}
            </Link>
          </div>
        )}

        {/* Cambio password */}
        <div className="card-dark">
          <h2 className="text-base font-semibold text-white mb-4 flex items-center gap-2">
            <Lock size={16} className="text-brand-400" /> {en ? 'Change Password' : 'Cambia Password'}
          </h2>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <label className="text-xs text-dark-300 block mb-1">{en ? 'Current password' : 'Password attuale'}</label>
              <input type="password" value={pwdForm.current}
                onChange={(e) => setPwdForm(f => ({ ...f, current: e.target.value }))}
                className="input-dark text-sm" placeholder="••••••••" required />
            </div>
            <div>
              <label className="text-xs text-dark-300 block mb-1">{en ? 'New password (min. 8 characters)' : 'Nuova password (min. 8 caratteri)'}</label>
              <input type="password" value={pwdForm.newPwd}
                onChange={(e) => setPwdForm(f => ({ ...f, newPwd: e.target.value }))}
                className="input-dark text-sm" placeholder="••••••••" required />
            </div>
            <div>
              <label className="text-xs text-dark-300 block mb-1">{en ? 'Confirm new password' : 'Conferma nuova password'}</label>
              <input type="password" value={pwdForm.confirm}
                onChange={(e) => setPwdForm(f => ({ ...f, confirm: e.target.value }))}
                className="input-dark text-sm" placeholder="••••••••" required />
            </div>
            <button type="submit" disabled={loading === 'password'} className="btn-primary text-sm px-4 py-2">
              {loading === 'password' ? (en ? 'Updating...' : 'Aggiornamento...') : (en ? 'Update password' : 'Aggiorna password')}
            </button>
          </form>
        </div>

        {/* GDPR Export */}
        <div className="card-dark">
          <h2 className="text-base font-semibold text-white mb-2 flex items-center gap-2">
            <Download size={16} className="text-brand-400" /> {en ? 'Export your data (GDPR)' : 'Esporta i tuoi dati (GDPR)'}
          </h2>
          <p className="text-xs text-dark-300 mb-4">
            {en ? 'Download all your data in JSON format: profile, recipes, ingredients, menu and sales.' : 'Scarica tutti i tuoi dati in formato JSON: profilo, ricette, ingredienti, menu e vendite.'}
          </p>
          <button onClick={handleExport} disabled={loading === 'export'}
            className="flex items-center gap-2 text-sm border border-dark-500 text-dark-200 hover:text-white hover:border-dark-400 px-4 py-2 rounded-lg transition-colors disabled:opacity-40">
            <Download size={14} />
            {loading === 'export' ? (en ? 'Exporting...' : 'Esportazione...') : (en ? 'Download my data' : 'Scarica i miei dati')}
          </button>
        </div>

        {/* Delete account */}
        <div className="card-dark border border-red-500/20">
          <h2 className="text-base font-semibold text-red-400 mb-2 flex items-center gap-2">
            <Trash2 size={16} /> {en ? 'Delete Account' : 'Elimina Account'}
          </h2>
          <p className="text-xs text-dark-300 mb-4">
            {en ? 'Permanent deletion. All your data will be removed irreversibly.' : 'Eliminazione permanente. Tutti i tuoi dati verranno rimossi in modo irreversibile.'}
          </p>
          {!showDeleteConfirm ? (
            <button onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-2 text-sm border border-red-500/40 text-red-400 hover:bg-red-500/10 px-4 py-2 rounded-lg transition-colors">
              <AlertTriangle size={14} /> {en ? 'Delete my account' : 'Elimina il mio account'}
            </button>
          ) : (
            <div className="space-y-3">
              <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-300">
                {en ? 'Irreversible action. Enter your password to confirm.' : 'Azione irreversibile. Inserisci la password per confermare.'}
              </div>
              <input type="password" value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="input-dark text-sm" placeholder={en ? 'Your current password' : 'La tua password attuale'} />
              <div className="flex gap-2">
                <button onClick={handleDeleteAccount} disabled={loading === 'delete'}
                  className="flex-1 py-2 text-sm bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white rounded-lg font-semibold transition-colors">
                  {loading === 'delete' ? (en ? 'Deleting...' : 'Eliminazione...') : (en ? 'Yes, delete account' : 'Sì, elimina account')}
                </button>
                <button onClick={() => { setShowDeleteConfirm(false); setDeletePassword(''); }}
                  className="flex-1 py-2 text-sm border border-dark-500 text-dark-200 hover:text-white rounded-lg transition-colors">
                  {en ? 'Cancel' : 'Annulla'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
