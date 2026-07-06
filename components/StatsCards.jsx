'use client';

import { format, parseISO } from 'date-fns';
import { formatPrice } from '@/lib/format';

export default function StatsCards({ stats, prices, routeLabel, pickDate }) {
  if (!stats || !prices || prices.length === 0) return null;

  const depDisplay = pickDate ? format(parseISO(pickDate), 'MMM d, yyyy') : '';
  const changeLabel = stats.change >= 0 ? `+${formatPrice(stats.change)}` : `-${formatPrice(Math.abs(stats.change))}`;
  const changeChip = stats.change > 0 ? 'chip-worst' : stats.change < 0 ? 'chip-best' : '';

  return (
    <div>
      <div className="stats-row">
        <div className="stat-chip">
          <span className="chip-value">{formatPrice(Math.round(stats.avg))}</span>
          <span className="chip-label">Average</span>
        </div>
        <div className="stat-chip chip-best">
          <span className="chip-value">{formatPrice(stats.min)}</span>
          <span className="chip-label">Lowest price</span>
        </div>
        <div className="stat-chip chip-worst">
          <span className="chip-value">{formatPrice(stats.max)}</span>
          <span className="chip-label">Highest price</span>
        </div>
        <div className="stat-chip">
          <span className="chip-value">{formatPrice(stats.first)}</span>
          <span className="chip-label">First recorded</span>
        </div>
        <div className="stat-chip">
          <span className="chip-value">{formatPrice(stats.last)}</span>
          <span className="chip-label">Most recent</span>
        </div>
        <div className={`stat-chip ${changeChip}`}>
          <span className="chip-value">{changeLabel}</span>
          <span className="chip-label">Change ({stats.changePercent}%)</span>
        </div>
      </div>

      <div className="route-info">
        <div className="route-info-left">
          <strong style={{ fontSize: '0.9rem', fontWeight: 500 }}>{routeLabel}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="route-dep">Flying on {depDisplay}</span>
          <span className="route-snapshots">{stats.count} price check{stats.count !== 1 ? 's' : ''}</span>
          <span className="route-currency">All prices in USD</span>
        </div>
      </div>
    </div>
  );
}