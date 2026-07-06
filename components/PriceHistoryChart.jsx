'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Bar, ComposedChart, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

export default function PriceHistoryChart({ prices, stats, routeLabel }) {
  const chartData = useMemo(() => {
    if (!prices || prices.length === 0) return [];
    return prices.map(p => ({
      date: p.date,
      price: p.price,
      airline: p.airline,
    }));
  }, [prices]);

  const avgPrice = stats?.avg || 0;

  if (!chartData.length) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>No data to display</h3>
          <p>Select a route to view prices across travel dates.</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="route-info">
        <div className="route-info-left">
          <strong style={{ fontSize: '0.9rem', fontWeight: 500 }}>{routeLabel}</strong>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="route-snapshots">{chartData.length} travel dates</span>
        </div>
      </div>

      <div className="stats-row">
        <div className="stat-chip">
          <span className="chip-value">${Math.round(stats.avg)}</span>
          <span className="chip-label">Average</span>
        </div>
        <div className="stat-chip chip-best">
          <span className="chip-value">${stats.min}</span>
          <span className="chip-label">Cheapest date</span>
        </div>
        <div className="stat-chip chip-worst">
          <span className="chip-value">${stats.max}</span>
          <span className="chip-label">Most expensive</span>
        </div>
        <div className="stat-chip">
          <span className="chip-value">{stats.count}</span>
          <span className="chip-label">Dates tracked</span>
        </div>
      </div>

      <div className="card">
        <div className="chart-wrapper">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11, fill: '#5f6368' }}
                tickFormatter={d => format(parseISO(d), 'MMM d')}
                interval="preserveStartEnd"
                minTickGap={40}
              />
              <YAxis
                tick={{ fontSize: 11, fill: '#5f6368' }}
                tickFormatter={v => `$${v}`}
                domain={['auto', 'auto']}
              />
              <Tooltip
                contentStyle={{ borderRadius: 8, border: '1px solid #dadce0', fontSize: 13 }}
                labelFormatter={d => format(parseISO(d), 'MMM d, yyyy')}
                formatter={(value, name) => [name === 'price' ? `$${value}` : value, name === 'price' ? 'Latest price' : name]}
              />
              <Legend />
              <Bar dataKey="price" name="Latest price" fill="#e8f0fe" radius={[4, 4, 0, 0]} barCategoryGap="20%" />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#1a73e8"
                strokeWidth={2}
                dot={{ r: 3, fill: '#1a73e8', strokeWidth: 0 }}
                connectNulls
              />
              {avgPrice > 0 && (
                <ReferenceLine
                  y={avgPrice}
                  stroke="#1e8e3e"
                  strokeDasharray="6 4"
                  strokeWidth={1.5}
                  label={{ value: `Avg $${Math.round(avgPrice)}`, position: 'right', fill: '#1e8e3e', fontSize: 11 }}
                />
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}