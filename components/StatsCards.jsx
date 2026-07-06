'use client';

import { format, parseISO } from 'date-fns';

export default function StatsCards({ stats, prices, routeLabel, pickDate }) {
  if (!stats || !prices || prices.length === 0) return null;

  const depDisplay = pickDate ? format(parseISO(pickDate), 'MMM d, yyyy') : '';
  const changeLabel = stats.change >= 0 ? `+$${stats.change}` : `-$${Math.abs(stats.change)}`;
  const changeClass = stats.change > 0 ? 'worst' : stats.change < 0 ? 'best' : '';

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card avg">
          <div className="value">${Math.round(stats.avg)}</div>
          <div className="label">Avg Price</div>
        </div>
        <div className="stat-card best">
          <div className="value">${stats.min}</div>
          <div className="label">Lowest Seen</div>
        </div>
        <div className="stat-card worst">
          <div className="value">${stats.max}</div>
          <div className="label">Highest Seen</div>
        </div>
        <div className="stat-card">
          <div className="value">${stats.first}</div>
          <div className="label">First Snapshot</div>
        </div>
        <div className="stat-card">
          <div className="value">${stats.last}</div>
          <div className="label">Latest Snapshot</div>
        </div>
        <div className={`stat-card ${changeClass}`}>
          <div className="value">{changeLabel}</div>
          <div className="label">Change ({stats.changePercent}%)</div>
        </div>
      </div>

      <div className="card">
        <h3 style={{ fontSize: '0.95rem', color: '#4a5568', marginBottom: 4 }}>
          {routeLabel}
        </h3>
        <p style={{ fontSize: '0.85rem', color: '#718096' }}>
          Departure {depDisplay} · {stats.count} snapshot{stats.count !== 1 ? 's' : ''} collected
        </p>
      </div>
    </div>
  );
}
