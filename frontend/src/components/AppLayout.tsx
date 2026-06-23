'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { isAuthenticated } from '@/lib/auth';
import Sidebar from './Sidebar';
import { Menu } from 'lucide-react';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-dark-900">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Top bar (solo mobile) */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 bg-dark-800 border-b border-dark-600 flex items-center gap-3 px-4 z-20">
        <button
          onClick={() => setSidebarOpen(true)}
          aria-label="Apri menu"
          className="text-dark-100 hover:text-white p-1"
        >
          <Menu size={22} />
        </button>
        <span className="font-bold text-white text-lg">
          <span className="text-brand-500">Risto</span>Brain
        </span>
      </header>

      <main className="md:ml-60 px-4 md:px-6 pb-8 pt-20 md:pt-6 overflow-y-auto min-h-screen">
        {children}
      </main>
    </div>
  );
}
