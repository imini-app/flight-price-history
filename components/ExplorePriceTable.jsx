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

  const cheapest = rows.reduce((best, g) =>
    g.avgPrice < best.avgPrice ? g : best, rows[0]);

  return (
    <div className="price-table-wrap">
      <div className="price-table-best">
        {t('exploreTable.cheapest', {
          date: format(parseISO(cheapest.date), dateFmt, { locale: dateFnsLocales[locale] }),
          price: formatPrice(cheapest.avgPrice, locale),
        })}
      </div>
      <table className="price-table">
        <thead>
          <tr>
            <th>{t('exploreTable.date')}</th>
            <th>{t('exploreTable.avg')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(g => (
            <tr key={g.date} className={g.date === cheapest.date ? 'pt-best-row' : ''}>
              <td className="pt-date">{format(parseISO(g.date), dateFmt, { locale: dateFnsLocales[locale] })}</td>
              <td className="pt-price">{formatPrice(g.avgPrice, locale)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
