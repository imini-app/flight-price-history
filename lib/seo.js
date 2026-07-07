import en from './i18n/en.json';
import zh from './i18n/zh.json';

export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://besttimetobook.com';

const copy = { en, zh };

export function getLocaleFromSearchParams(searchParams) {
  return searchParams?.lang === 'zh' ? 'zh' : 'en';
}

export function buildMetadata({ locale = 'en', path = '', pageTitle } = {}) {
  const c = copy[locale] || copy.en;
  const title = pageTitle || c.meta.title;
  const description = c.meta.description;
  const basePath = path || '';
  const canonical = locale === 'zh' ? `${basePath}?lang=zh` : basePath || '/';
  const ogLocale = locale === 'zh' ? 'zh_CN' : 'en_US';

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: {
        en: basePath || '/',
        zh: `${basePath}?lang=zh`,
        'x-default': basePath || '/',
      },
    },
    openGraph: {
      type: 'website',
      locale: ogLocale,
      url: `${SITE_URL}${basePath}`,
      siteName: title,
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}
