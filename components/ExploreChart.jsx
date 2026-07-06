'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

export default function ExploreChart({ grouped, stats, routeLabel }) {
  const chartData = useMemo(() => {
    if (!grouped || grouped.length === 0) return [];
    return grouped.map(g => ({
      date: g.date,
      price: g.avgPrice,
      minPrice: g.minPrice,
      maxPrice: g.maxPrice,
      snapshots: g.snapshots,
    }));
  }, [grouped]);

  const avgPrice = stats?.avg || 0;

  if (!chartData.length) {
    return (
      <div className="card">
        <div className="empty-state">
          <h3>No data to display</h3>
          <p>Select a route and date to explore prices.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="route-info" style={{ marginBottom: 16 }}>
        <strong style={{ fontSize: '0.9rem', fontWeight: 500 }}>{routeLabel}</strong>
        <span className="route-snapshots">{chartData.length} departure dates</span>
      </div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#718096' }}
              tickFormatter={d => format(parseISO(d), 'MMM d')}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#718096' }}
              tickFormatter={v => `$${v}`}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              labelFormatter={d => format(parseISO(d), 'MMM d, yyyy')}
              formatter={(value, name) => {
                const labels = { price: 'Avg Price', minPrice: 'Lowest', maxPrice: 'Highest', snapshots: 'Snapshots' };
                return [name === 'price' ? `$${value}` : value, labels[name] || name];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              name="Avg Price"
              stroke="#1a73e8"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#1a73e8' }}
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
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}