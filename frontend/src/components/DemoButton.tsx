'use client';

import { useState } from 'react';
import { authApi } from '@/lib/api';
import { setAuth } from '@/lib/auth';
import { Play, Loader2 } from 'lucide-react';

export default function DemoButton({ label = 'Prova la demo' }: { label?: string }) {
  const [loading, setLoading] = useState(false);

  const handleDemo = async () => {
    setLoading(true);
    try {
      const res = await authApi.login('chef@demo.it', 'demo1234');
      setAuth({ token: res.data.token, user: res.data.user, workspace: res.data.workspace });
      window.location.href = '/dashboard';
    } catch {
      window.location.href = '/login';
    }
  };

  return (
    <button
      onClick={handleDemo}
      disabled={loading}
      className="inline-flex items-center gap-2 px-6 py-3 rounded-lg border border-white/15 hover:border-white/30 text-white/90 font-semibold transition-colors disabled:opacity-50"
    >
      {loading ? <Loader2 size={18} className="animate-spin" /> : <Play size={18} />} {label}
    </button>
  );
}
