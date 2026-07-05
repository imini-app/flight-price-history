'use client';

import { format, parseISO } from 'date-fns';

function formatMonth(monthStr) {
  const d = parseISO(monthStr + '-01');
  return format(d, 'MMM yyyy');
}

export default function StatsCards({ stats, prices, routeLabel, dateRange }) {
  if (!stats || !prices || prices.length === 0) return null;

  return (
    <div>
      <div className="stats-grid">
        <div className="stat-card best">
          <div className="value">${stats.min}</div>
          <div className="label">Lowest Price</div>
        </div>
        <div className="stat-card worst">
          <div className="value">${stats.max}</div>
          <div className="label">Highest Price</div>
        </div>
        <div className="stat-card avg">
          <div className="value">${Math.round(stats.avg)}</div>
          <div className="label">Average Price</div>
        </div>
        <div className="stat-card">
          <div className="value">${Math.round(stats.median)}</div>
          <div className="label">Median Price</div>
        </div>
        <div className="stat-card">
          <div className="value">${stats.range}</div>
          <div className="label">Price Range</div>
        </div>
        <div className="stat-card best">
          <div className="value">{stats.bestMonth ? formatMonth(stats.bestMonth.month) : '—'}</div>
          <div className="label">Cheapest Month</div>
        </div>
      </div>

      {stats.airlines && stats.airlines.length > 1 && (
        <div className="card">
          <h3 style={{ fontSize: '0.95rem', color: '#4a5568', marginBottom: 12 }}>Average Price by Airline</h3>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24 }}>
            {stats.airlines.map(a => (
              <div key={a.name} style={{ flex: '1 1 160px' }}>
                <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#2d3748' }}>{a.name}</div>
                <div style={{ fontSize: '0.8rem', color: '#718096' }}>
                  Avg ${Math.round(a.avg)} · Min ${a.min} · Max ${a.max}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
