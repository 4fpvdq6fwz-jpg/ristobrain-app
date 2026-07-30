'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { BookOpen, FileText, PackageX, Brain, Plus, X } from 'lucide-react';
import { useLang } from './LanguageProvider';

const actions = [
  { href: '/recipes?new=1', icon: BookOpen, titleKey: 'qa.newRecipe', descKey: 'qa.newRecipeDesc' },
  { href: '/fatture', icon: FileText, titleKey: 'qa.invoice', descKey: 'qa.invoiceDesc' },
  { href: '/scorte', icon: PackageX, titleKey: 'qa.stock', descKey: 'qa.stockDesc' },
  { href: '/ai', icon: Brain, titleKey: 'qa.ai', descKey: 'qa.aiDesc' },
];

export function QuickActionsFab({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      aria-label="Azione rapida"
      className="fixed z-40 right-4 bottom-20 md:right-6 md:bottom-6 w-14 h-14 rounded-2xl
                 bg-gradient-to-br from-brand-500 to-brand-600 text-white shadow-brand
                 flex items-center justify-center transition-transform hover:scale-105 active:scale-95"
    >
      <Plus size={26} />
    </button>
  );
}

export default function QuickActions({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full md:max-w-md bg-dark-800 border border-dark-600 rounded-t-3xl md:rounded-3xl p-6 shadow-card animate-slideup">
        <div className="flex items-center justify-between mb-1">
          <h3 className="text-lg font-bold text-white">⚡ {t('qa.title')}</h3>
          <button onClick={onClose} className="text-dark-300 hover:text-white" aria-label={t('qa.close')}>
            <X size={20} />
          </button>
        </div>
        <p className="text-sm text-dark-300 mb-5">{t('qa.subtitle')}</p>
        <div className="grid grid-cols-2 gap-3">
          {actions.map(({ href, icon: Icon, titleKey, descKey }) => (
            <Link
              key={href}
              href={href}
              onClick={onClose}
              className="flex flex-col items-start gap-2 p-4 rounded-2xl bg-dark-700 border border-dark-600
                         hover:border-brand-500/60 hover:-translate-y-0.5 transition-all"
            >
              <span className="w-10 h-10 rounded-xl bg-brand-500/15 flex items-center justify-center">
                <Icon size={19} className="text-brand-400" />
              </span>
              <span className="font-semibold text-sm text-white">{t(titleKey)}</span>
              <span className="text-xs text-dark-300 leading-snug">{t(descKey)}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
