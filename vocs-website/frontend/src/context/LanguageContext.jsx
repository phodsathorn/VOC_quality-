import React, { createContext, useContext, useState, useEffect } from 'react';
import translations from '../locales';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    return localStorage.getItem('voc_app_lang') || 'EN';
  });

  const setLang = (newLang) => {
    const validLang = newLang === 'TH' ? 'TH' : 'EN';
    setLangState(validLang);
    localStorage.setItem('voc_app_lang', validLang);
    document.documentElement.lang = validLang.toLowerCase();
  };

  useEffect(() => {
    document.documentElement.lang = lang.toLowerCase();
  }, [lang]);

  const t = (key, fallback = '') => {
    return translations[lang]?.[key] ?? fallback ?? key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t, isThai: lang === 'TH' }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    // Fallback if rendered outside provider
    return {
      lang: 'EN',
      setLang: () => {},
      t: (key, fallback = '') => fallback || key,
      isThai: false,
    };
  }
  return context;
}
