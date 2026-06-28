'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { translations, Lang } from '@/lib/translations';

type Ctx = {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
};

const LangContext = createContext<Ctx>({
  lang: 'it',
  setLang: () => {},
  t: (k) => k,
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>('it');

  useEffect(() => {
    try {
      const saved = localStorage.getItem('rb_lang');
      if (saved === 'it' || saved === 'en') {
        setLangState(saved);
        return;
      }
      const nav = (navigator.language || 'it').toLowerCase();
      setLangState(nav.startsWith('en') ? 'en' : 'it');
    } catch {}
  }, []);

  const setLang = (l: Lang) => {
    setLangState(l);
    try { localStorage.setItem('rb_lang', l); } catch {}
  };

  const t = (key: string) => translations[lang][key] ?? translations.it[key] ?? key;

  return (
    <LangContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLang() {
  return useContext(LangContext);
}
