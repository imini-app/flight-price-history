'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';

export default function PriceChart({ prices, stats }) {
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
          <p>Select a route and date to view price history.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
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
              formatter={(value, name) => [name === 'price' ? `$${value}` : value, name === 'price' ? 'Price' : name]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              name="Price"
              stroke="#3182ce"
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4, fill: '#3182ce' }}
              connectNulls
            />
            {avgPrice > 0 && (
              <ReferenceLine
                y={avgPrice}
                stroke="#38a169"
                strokeDasharray="6 4"
                strokeWidth={1.5}
                label={{ value: `Avg $${Math.round(avgPrice)}`, position: 'right', fill: '#38a169', fontSize: 11 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
