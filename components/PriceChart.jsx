'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

export default function PriceChart({ prices, stats, pickDate }) {
  const chartData = useMemo(() => {
    if (!prices || prices.length === 0) return [];
    return prices.map(p => ({
      snapshot: p.snapshot,
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
          <p>Select a route and departure date to view price trend.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
            <XAxis
              dataKey="snapshot"
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
              labelFormatter={d => `Price check: ${format(parseISO(d), 'MMM d, yyyy')}`}
              formatter={(value, name) => [name === 'price' ? `$${value}` : value, name === 'price' ? 'Price' : name]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              name="Price"
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