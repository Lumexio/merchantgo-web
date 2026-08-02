import { createContext, useContext, useState } from 'react';
import en from './en.js';
import es from './es.js';

const LOCALES = { en, es };
const LANG_KEY = 'merchantgo.lang';

export const I18nContext = createContext({ t: en, lang: 'en', setLang: () => {} });

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(() => localStorage.getItem(LANG_KEY) || 'en');
  const setLang = (l) => { localStorage.setItem(LANG_KEY, l); setLangState(l); };
  return <I18nContext.Provider value={{ t: LOCALES[lang] || en, lang, setLang }}>{children}</I18nContext.Provider>;
}

export const useI18n = () => useContext(I18nContext);
