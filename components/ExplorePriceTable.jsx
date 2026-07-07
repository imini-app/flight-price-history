'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { formatPrice } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/context';
import { dateFnsLocales } from '@/lib/i18n/date-locales';

export default function ExplorePriceTable({ grouped }) {
  const { t, locale } = useTranslation();

  const rows = useMemo(() => {
    if (!grouped || grouped.length === 0) return [];
    return [...grouped].sort((a, b) => a.date.localeCompare(b.date));
  }, [grouped]);

  if (!rows.length) return null;

  const dateFmt = locale === 'zh' ? 'M月d日' : 'MMM d';

  return (
    <div className="price-table-wrap">
      <table className="price-table">
        <thead>
          <tr>
            <th>{t('exploreTable.date')}</th>
            <th>{t('exploreTable.low')}</th>
            <th>{t('exploreTable.avg')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(g => (
            <tr key={g.date}>
              <td className="pt-date">{format(parseISO(g.date), dateFmt, { locale: dateFnsLocales[locale] })}</td>
              <td className="pt-price">{formatPrice(g.minPrice, locale)}</td>
              <td>{formatPrice(g.avgPrice, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
