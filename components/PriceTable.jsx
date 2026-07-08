'use client';

import { useMemo } from 'react';
import { differenceInDays, format, parseISO } from 'date-fns';
import { formatPrice } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/context';
import { dateFnsLocales } from '@/lib/i18n/date-locales';

export default function PriceTable({ prices, pickDate }) {
  const { t, locale } = useTranslation();

  const rows = useMemo(() => {
    if (!prices || prices.length === 0) return [];
    const departure = parseISO(pickDate);
    return [...prices].reverse().map(p => {
      const snapDate = parseISO(p.snapshot);
      const daysBefore = differenceInDays(departure, snapDate);
      const prefix = daysBefore === 0 ? t('priceTable.dayOfDeparture') : t('priceTable.daysPrior', { days: daysBefore });
      const dateStr = format(snapDate, locale === 'zh' ? 'yyyy年M月d日' : 'MMM d, yyyy', { locale: dateFnsLocales[locale] });
      return {
        snapshot: p.snapshot,
        daysLabel: `${prefix} (${dateStr})`,
        daysNum: daysBefore,
        price: p.price,
        airline: p.airline || '',
      };
    });
  }, [prices, pickDate, t, locale]);

  if (!rows.length) return null;

  const cheapestRow = rows.reduce((best, r) => (r.price < best.price ? r : best), rows[0]);

  const dateFmt = locale === 'zh' ? 'M月d日' : 'MMM d';

  return (
    <div className="price-table-wrap">
      <div className="price-table-best">
        {t('priceTable.cheapest', {
          date: format(parseISO(cheapestRow.snapshot), dateFmt, { locale: dateFnsLocales[locale] }),
          price: formatPrice(cheapestRow.price, locale),
        })}
      </div>
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
            <tr key={i} className={r === cheapestRow ? 'pt-best-row' : ''}>
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
