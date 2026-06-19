'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import toast from 'react-hot-toast';

export default function LoginPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    fullName: '',
    workspaceName: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const switchTab = (newTab: 'login' | 'register') => {
    setTab(newTab);
    // Pulisce i campi quando si passa alla registrazione per evitare
    // che i dati del tab login restino precompilati
    setForm({ email: '', password: '', fullName: '', workspaceName: '' });
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await authApi.login(form.email, form.password);
      setAuth({ token: res.data.token, user: res.data.user, workspace: res.data.workspace });
      toast.success('Benvenuto!');
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Credenziali non valide');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fullName.trim()) {
      toast.error('Inserisci il tuo nome completo');
      return;
    }
    if (!form.workspaceName.trim()) {
      toast.error('Inserisci il nome del ristorante');
      return;
    }
    if (form.password.length < 8) {
      toast.error('La password deve essere di almeno 8 caratteri');
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register({
        email: form.email,
        password: form.password,
        fullName: form.fullName,
        workspaceName: form.workspaceName,
      });
      setAuth({ token: res.data.token, user: res.data.user, workspace: res.data.workspace });
      toast.success('Account creato! Benvenuto in RistoBrain!');
      window.location.href = '/dashboard';
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Errore nella registrazione');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🍽️</div>
          <h1 className="text-3xl font-bold text-white">
            <span className="text-brand-500">Risto</span>Brain
          </h1>
          <p className="text-dark-200 mt-2 text-sm">Food Cost & Menu Engineering</p>
        </div>

        {/* Card */}
        <div className="card-dark">
          {/* Tabs */}
          <div className="flex mb-6 bg-dark-700 rounded-lg p-1">
            <button
              onClick={() => switchTab('login')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'login' ? 'bg-dark-500 text-white' : 'text-dark-200 hover:text-white'
              }`}
            >
              Accedi
            </button>
            <button
              onClick={() => switchTab('register')}
              className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
                tab === 'register' ? 'bg-dark-500 text-white' : 'text-dark-200 hover:text-white'
              }`}
            >
              Registrati
            </button>
          </div>

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-sm text-dark-200 block mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="input-dark" placeholder="chef@ristorante.it" required />
              </div>
              <div>
                <label className="text-sm text-dark-200 block mb-1">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  className="input-dark" placeholder="••••••••" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Accesso...' : 'Accedi'}
              </button>
              <p className="text-center text-xs text-dark-300 mt-3">
                Demo: chef@demo.it / demo1234
              </p>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="text-sm text-dark-200 block mb-1">Nome completo</label>
                <input name="fullName" value={form.fullName} onChange={handleChange}
                  className="input-dark" placeholder="Chef Mario Rossi" required />
              </div>
              <div>
                <label className="text-sm text-dark-200 block mb-1">Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange}
                  className="input-dark" placeholder="mario@ristorante.it" required />
              </div>
              <div>
                <label className="text-sm text-dark-200 block mb-1">Password</label>
                <input name="password" type="password" value={form.password} onChange={handleChange}
                  className="input-dark" placeholder="min. 8 caratteri" required minLength={8} />
              </div>
              <div>
                <label className="text-sm text-dark-200 block mb-1">Nome ristorante</label>
                <input name="workspaceName" value={form.workspaceName} onChange={handleChange}
                  className="input-dark" placeholder="Da Mario" required />
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
                {loading ? 'Creazione account...' : 'Crea account gratuito'}
              </button>
              <p className="text-center text-xs text-dark-300 mt-2">
                Registrandoti accetti i termini di utilizzo
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
