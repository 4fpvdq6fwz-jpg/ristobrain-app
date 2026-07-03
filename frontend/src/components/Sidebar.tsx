'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { clearAuth, getAuth } from '@/lib/auth';
import {
  LayoutDashboard, Package, BookOpen, UtensilsCrossed,
  TrendingUp, BarChart2, ShoppingCart, LogOut,
  MapPin, Truck, Brain, CreditCard, Settings, X, Bell, PackageX, ShieldAlert, FileText,
  Sparkles, ScrollText
} from 'lucide-react';
import clsx from 'clsx';
import { useLang } from './LanguageProvider';
import LangSwitcher from './LangSwitcher';

import type { LucideIcon } from 'lucide-react';

type NavItem = { href: string; labelKey: string; icon: LucideIcon };
type NavSection = { titleKey: string; items: NavItem[] };

const navSections: NavSection[] = [
  {
    titleKey: 'nav.secOverview',
    items: [
      { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
      { href: '/ai', labelKey: 'nav.ai', icon: Brain },
      { href: '/creativita', labelKey: 'nav.creativity', icon: Sparkles },
    ],
  },
  {
    titleKey: 'nav.secKitchen',
    items: [
      { href: '/recipes', labelKey: 'nav.recipes', icon: BookOpen },
      { href: '/ingredients', labelKey: 'nav.ingredients', icon: Package },
      { href: '/menus', labelKey: 'nav.menus', icon: UtensilsCrossed },
      { href: '/allergeni', labelKey: 'nav.allergens', icon: ShieldAlert },
      { href: '/scorte', labelKey: 'nav.stock', icon: PackageX },
      { href: '/suppliers', labelKey: 'nav.suppliers', icon: Truck },
      { href: '/fatture', labelKey: 'nav.invoices', icon: FileText },
    ],
  },
  {
    titleKey: 'nav.secBusiness',
    items: [
      { href: '/sales', labelKey: 'nav.sales', icon: ShoppingCart },
      { href: '/engineering', labelKey: 'nav.engineering', icon: BarChart2 },
      { href: '/pricing', labelKey: 'nav.pricing', icon: TrendingUp },
      { href: '/avvisi', labelKey: 'nav.priceAlerts', icon: Bell },
    ],
  },
  {
    titleKey: 'nav.secAccount',
    items: [
      { href: '/locations', labelKey: 'nav.locations', icon: MapPin },
      { href: '/regole', labelKey: 'nav.rules', icon: ScrollText },
      { href: '/billing', labelKey: 'nav.billing', icon: CreditCard },
      { href: '/impostazioni', labelKey: 'nav.settings', icon: Settings },
    ],
  },
];

export default function Sidebar({ open = false, onClose }: { open?: boolean; onClose?: () => void }) {
  const pathname = usePathname();
  const router = useRouter();
  const { t } = useLang();
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
        <div className="md:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-30" onClick={onClose} />
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
            <span className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-500 to-brand-600 flex items-center justify-center text-lg shadow-brand">🧠</span>
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
        <nav className="flex-1 px-3 py-3 overflow-y-auto">
          {navSections.map((section) => (
            <div key={section.titleKey} className="mb-2">
              <p className="px-3 pt-2 pb-1 text-[10.5px] font-bold uppercase tracking-wider text-dark-400">
                {t(section.titleKey)}
              </p>
              <ul className="space-y-0.5">
                {section.items.map(({ href, labelKey, icon: Icon }) => {
                  const active = pathname === href || pathname.startsWith(href + '/');
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={onClose}
                        className={clsx(
                          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all group',
                          active
                            ? 'bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand'
                            : 'text-dark-200 hover:text-white hover:bg-dark-700'
                        )}
                      >
                        <Icon size={17} className={active ? 'text-white' : 'text-dark-300 group-hover:text-white'} />
                        {t(labelKey)}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Language */}
        <div className="px-5 py-3 border-t border-dark-600 flex items-center justify-between">
          <span className="text-xs text-dark-400">{t('common.language')}</span>
          <LangSwitcher />
        </div>

        {/* User */}
        <div className="px-3 py-4 border-t border-dark-600">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl hover:bg-dark-700 cursor-pointer group" onClick={handleLogout}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500/40 to-brand-600/40 flex items-center justify-center text-brand-300 text-sm font-bold">
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
