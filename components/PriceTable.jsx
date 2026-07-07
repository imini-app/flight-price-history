'use client';

import { useMemo } from 'react';
import { differenceInDays, parseISO } from 'date-fns';
import { formatPrice } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/context';

export default function PriceTable({ prices, pickDate }) {
  const { t, locale } = useTranslation();

  const rows = useMemo(() => {
    if (!prices || prices.length === 0) return [];
    const departure = parseISO(pickDate);
    return [...prices].reverse().map(p => {
      const daysBefore = differenceInDays(departure, parseISO(p.snapshot));
      return {
        daysLabel: daysBefore === 0 ? t('priceTable.dayOfDeparture') : t('priceTable.daysPrior', { days: daysBefore }),
        daysNum: daysBefore,
        price: p.price,
        airline: p.airline || '',
      };
    });
  }, [prices, pickDate, t, locale]);

  if (!rows.length) return null;

  return (
    <div className="price-table-wrap">
      <table className="price-table">
        <thead>
          <tr>
            <th>{t('priceTable.when')}</th>
            <th>{t('priceChart.price')}</th>
            <th>{t('priceTable.airline')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td className="pt-date">{r.daysLabel}</td>
              <td className="pt-price">{formatPrice(r.price, locale)}</td>
              <td className="pt-airline">{r.airline || '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
