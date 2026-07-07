import PageClient from './page.client';
import { buildMetadata, getLocaleFromSearchParams } from '@/lib/seo';

export function generateMetadata({ searchParams }) {
  const locale = getLocaleFromSearchParams(searchParams);
  return buildMetadata({ locale });
}

export default function Page() {
  return <PageClient />;
}
