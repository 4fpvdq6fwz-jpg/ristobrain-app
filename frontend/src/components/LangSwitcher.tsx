'use client';

import { useEffect, useState } from 'react';
import { Globe } from 'lucide-react';
import { useLang } from './LanguageProvider';

export default function LangSwitcher() {
  const { lang, setLang } = useLang();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <div className="flex items-center gap-1.5 text-xs">
      <Globe size={14} className="text-dark-300" />
      <button
        onClick={() => setLang('it')}
        className={mounted && lang === 'it' ? 'text-brand-400 font-semibold' : 'text-dark-300 hover:text-white transition-colors'}
        aria-label="Italiano"
      >
        IT
      </button>
      <span className="text-dark-500">/</span>
      <button
        onClick={() => setLang('en')}
        className={mounted && lang === 'en' ? 'text-brand-400 font-semibold' : 'text-dark-300 hover:text-white transition-colors'}
        aria-label="English"
      >
        EN
      </button>
    </div>
  );
}
