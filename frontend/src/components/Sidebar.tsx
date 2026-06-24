'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuth, getAuth } from '@/lib/auth';
import {
  LayoutDashboard, Package, BookOpen, UtensilsCrossed,
  TrendingUp, BarChart2, ShoppingCart, LogOut, ChevronRight,
  MapPin, Truck, Brain, CreditCard, Settings, X, Bell, PackageX, ShieldAlert
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/ingredients', label: 'Ingredienti', icon: Package },
  { href: '/recipes', label: 'Ricette', icon: BookOpen },
  { href: '/menus', label: 'Menu', icon: UtensilsCrossed },
  { href: '/allergeni', label: 'Allergeni', icon: ShieldAlert },
  { href: '/sales', label: 'Vendite', icon: ShoppingCart },
  { href: '/engineering', label: 'Analisi Menu', icon: BarChart2 },
  { href: '/pricing', label: 'Prezzi', icon: TrendingUp },
  { href: '/avvisi', label: 'Avvisi prezzi', icon: Bell },
  { href: '/ai', label: 'Consulente AI', icon: Brain },
  { href: '/locations', label: 'Locali', icon: MapPin },
  { href: '/suppliers', label: 'Fornitori', icon: Truck },
  { href: '/scorte', label: 'Scorte & Ordini', icon: PackageX },
  { href: '/billing', label: 'Piano', icon: CreditCard },
  { href: '/impostazioni', label: 'Impostazioni', icon: Settings },
];

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const auth = mounted ? getAuth() : null;

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  return (
    <>
      {open && (
        <div className="md:hidden fixed inset-0 bg-black/50 z-30" onClick={onClose} />
      )}

      <aside
        className={clsx(
          'w-60 bg-dark-800 border-r border-dark-600 flex flex-col h-screen fixed left-0 top-0 z-40 transition-transform duration-200 md:translate-x-0',
          open ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-dark-600 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="text-2xl">🍽️</span>
            <div>
              <h1 className="font-bold text-white text-lg leading-none">
                <span className="text-brand-500">Risto</span>Brain
              </h1>
              <p className="text-xs text-dark-300 mt-0.5">{auth?.workspace?.name || ' '}</p>
            </div>
          </div>
          <button onClick={onClose} className="md:hidden text-dark-300 hover:text-white" aria-label="Chiudi menu">
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 overflow-y-auto">
          <ul className="space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const active = pathname === href || pathname.startsWith(href + '/');
              return (
                <li key={href}>
                  <Link
                    href={href}
                    onClick={onClose}
                    className={clsx(
                      'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group',
                      active
                        ? 'bg-brand-600/20 text-brand-400 border border-brand-600/30'
                        : 'text-dark-200 hover:text-white hover:bg-dark-700'
                    )}
                  >
                    <Icon size={17} className={active ? 'text-brand-400' : 'text-dark-300 group-hover:text-white'} />
                    {label}
                    {active && <ChevronRight size={14} className="ml-auto text-brand-400" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-dark-600">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-dark-700 cursor-pointer group" onClick={handleLogout}>
            <div className="w-8 h-8 rounded-full bg-brand-600/30 flex items-center justify-center text-brand-400 text-sm font-bold">
              {auth?.user?.fullName?.[0] || '?'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{auth?.user?.fullName || ' '}</p>
              <p className="text-xs text-dark-300 capitalize">{auth?.workspace?.role || ' '}</p>
            </div>
            <LogOut size={15} className="text-dark-300 group-hover:text-red-400 transition-colors" />
          </div>
        </div>
      </aside>
    </>
  );
}
