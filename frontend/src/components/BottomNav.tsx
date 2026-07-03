'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, BookOpen, PackageX, ShoppingCart, Brain } from 'lucide-react';
import clsx from 'clsx';
import { useLang } from './LanguageProvider';

const items = [
  { href: '/dashboard', labelKey: 'nav.dashboard', icon: LayoutDashboard },
  { href: '/recipes', labelKey: 'nav.recipes', icon: BookOpen },
  { href: '/scorte', labelKey: 'nav.stock', icon: PackageX },
  { href: '/sales', labelKey: 'nav.sales', icon: ShoppingCart },
  { href: '/ai', labelKey: 'nav.ai', icon: Brain },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { t } = useLang();

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-30 bg-dark-800/95 backdrop-blur-md
                 border-t border-dark-600 flex justify-around px-1 pt-1.5"
      style={{ paddingBottom: 'calc(0.5rem + env(safe-area-inset-bottom))' }}
    >
      {items.map(({ href, labelKey, icon: Icon }) => {
        const active = pathname === href || pathname.startsWith(href + '/');
        return (
          <Link
            key={href}
            href={href}
            className={clsx(
              'flex flex-col items-center gap-0.5 flex-1 py-1.5 rounded-xl text-[10px] font-semibold transition-colors',
              active ? 'text-brand-400' : 'text-dark-300 hover:text-dark-100'
            )}
          >
            <Icon size={21} className={clsx('transition-transform', active && '-translate-y-0.5 scale-110')} />
            {t(labelKey)}
          </Link>
        );
      })}
    </nav>
  );
}
