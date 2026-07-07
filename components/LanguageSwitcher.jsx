'use client';

import { useTranslation } from '@/lib/i18n/context';

export default function LanguageSwitcher() {
  const { locale, setLocale, t } = useTranslation();

  return (
    <div className="language-switcher">
      <button
        className={`lang-btn ${locale === 'en' ? 'active' : ''}`}
        onClick={() => setLocale('en')}
        disabled={locale === 'en'}
      >
        EN
      </button>
      <span className="lang-divider">|</span>
      <button
        className={`lang-btn ${locale === 'zh' ? 'active' : ''}`}
        onClick={() => setLocale('zh')}
        disabled={locale === 'zh'}
      >
        中文
      </button>
    </div>
  );
}
