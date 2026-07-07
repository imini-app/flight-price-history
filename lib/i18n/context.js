'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import en from './en.json';
import zh from './zh.json';

const translations = { en, zh };
const I18nContext = createContext(null);

function getLangFromUrl() {
  if (typeof window === 'undefined') return null;
  const params = new URLSearchParams(window.location.search);
  const lang = params.get('lang');
  if (lang === 'en' || lang === 'zh') return lang;
  return null;
}

function updateUrlLang(locale) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (locale === 'en') {
    url.searchParams.delete('lang');
  } else {
    url.searchParams.set('lang', locale);
  }
  window.history.replaceState(null, '', url.toString());
}

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState('en');
  const initialised = useRef(false);

  useEffect(() => {
    if (initialised.current) return;
    initialised.current = true;

    const urlLang = getLangFromUrl();
    if (urlLang) {
      setLocaleState(urlLang);
      try { localStorage.setItem('locale', urlLang); } catch {}
    } else {
      try {
        const saved = localStorage.getItem('locale');
        if (saved === 'en' || saved === 'zh') setLocaleState(saved);
      } catch {}
    }
  }, []);

  const setLocale = useCallback((l) => {
    setLocaleState(l);
    try { localStorage.setItem('locale', l); } catch {}
    updateUrlLang(l);
  }, []);

  const t = useCallback((key, params) => {
    const keys = key.split('.');
    let value = translations[locale];
    for (const k of keys) {
      if (value == null) return key;
      value = value[k];
    }
    if (Array.isArray(value)) return value;
    if (typeof value === 'string' && params) {
      return value.replace(/\{(\w+)\}/g, (_, k) => params[k] != null ? params[k] : `{${k}}`);
    }
    return value ?? key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useTranslation must be used within I18nProvider');
  return ctx;
}
