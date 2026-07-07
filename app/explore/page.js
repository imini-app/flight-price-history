import ExplorePage from './page.client';
import { buildMetadata, getLocaleFromSearchParams } from '@/lib/seo';
import en from '@/lib/i18n/en.json';
import zh from '@/lib/i18n/zh.json';

const exploreTitles = { en: en.meta.exploreTitle, zh: zh.meta.exploreTitle };

export function generateMetadata({ searchParams }) {
  const locale = getLocaleFromSearchParams(searchParams);
  return buildMetadata({
    locale,
    path: '/explore',
    pageTitle: exploreTitles[locale],
  });
}

export default function Page() {
  return <ExplorePage />;
}
