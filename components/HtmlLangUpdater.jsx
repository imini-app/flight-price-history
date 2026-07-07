'use client';

import { useEffect } from 'react';
import { useTranslation } from '@/lib/i18n/context';

const htmlLangs = { en: 'en', zh: 'zh-Hans' };

export default function HtmlLangUpdater() {
  const { locale, t } = useTranslation();

  useEffect(() => {
    document.documentElement.lang = htmlLangs[locale] || 'en';
    document.title = t('meta.title');
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', t('meta.description'));
  }, [locale, t]);

  return null;
}
