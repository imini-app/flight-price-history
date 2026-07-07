'use client';

import { useMemo } from 'react';
import { format, parseISO } from 'date-fns';
import { formatPrice } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/context';
import { dateFnsLocales } from '@/lib/i18n/date-locales';

export default function PriceTable({ prices }) {
  const { t, locale } = useTranslation();

  const rows = useMemo(() => {
    if (!prices || prices.length === 0) return [];
    return [...prices].reverse().map(p => ({
      snapshot: format(parseISO(p.snapshot), 'MMM d, yyyy', { locale: dateFnsLocales[locale] }),
      price: p.price,
      airline: p.airline || '',
    }));
  }, [prices, locale]);

  if (!rows.length) return null;

  return (
    <div className="price-table-wrap">
      <table className="price-table">
        <thead>
          <tr>
            <th>Date</th>
            <th>{t('priceChart.price')}</th>
            <th>Airline</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="pt-date">{r.snapshot}</td>
              <td className="pt-price">{formatPrice(r.price, locale)}</td>
              <td className="pt-airline">{r.airline || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
