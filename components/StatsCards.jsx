'use client';

import { format, parseISO } from 'date-fns';
import { formatPrice } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/context';
import { dateFnsLocales } from '@/lib/i18n/date-locales';

export default function StatsCards({ stats, prices, routeLabel, pickDate }) {
  const { t, locale } = useTranslation();
  if (!stats || !prices || prices.length === 0) return null;

  const depDisplay = pickDate ? format(parseISO(pickDate), 'MMM d, yyyy', { locale: dateFnsLocales[locale] }) : '';
  const changeLabel = stats.change >= 0 ? `+${formatPrice(stats.change, locale)}` : `-${formatPrice(Math.abs(stats.change), locale)}`;
  const changeChip = stats.change > 0 ? 'chip-worst' : stats.change < 0 ? 'chip-best' : '';

  return (
    <div>
      <div className="stats-row">
        <div className="stat-chip">
          <span className="chip-value">{formatPrice(Math.round(stats.avg), locale)}</span>
          <span className="chip-label">{t('statsCards.average')}</span>
        </div>
        <div className="stat-chip chip-best">
          <span className="chip-value">{formatPrice(stats.min, locale)}</span>
          <span className="chip-label">{t('statsCards.lowest')}</span>
        </div>
        <div className="stat-chip chip-worst">
          <span className="chip-value">{formatPrice(stats.max, locale)}</span>
          <span className="chip-label">{t('statsCards.highest')}</span>
        </div>
        <div className="stat-chip">
          <span className="chip-value">{formatPrice(stats.first, locale)}</span>
          <span className="chip-label">{t('statsCards.firstRecorded')}</span>
        </div>
        <div className="stat-chip">
          <span className="chip-value">{formatPrice(stats.last, locale)}</span>
          <span className="chip-label">{t('statsCards.mostRecent')}</span>
        </div>
        <div className={`stat-chip ${changeChip}`}>
          <span className="chip-value">{changeLabel}</span>
          <span className="chip-label">{t('statsCards.change', { percent: stats.changePercent })}</span>
        </div>
      </div>

      <div className="route-info">
        <div className="route-info-left">
          <strong style={{ fontSize: '0.9rem', fontWeight: 500 }}>{routeLabel}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="route-dep">{t('statsCards.flyingOn', { date: depDisplay })}</span>
          <span className="route-snapshots">{stats.count === 1 ? t('statsCards.priceCheck', { count: stats.count }) : t('statsCards.priceChecks', { count: stats.count })}</span>
          <span className="route-currency">{t('statsCards.allPricesUSD')}</span>
        </div>
      </div>
    </div>
  );
}