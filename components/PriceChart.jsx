'use client';

import { useMemo } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  ReferenceLine, Legend
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatPrice } from '@/lib/format';
import { useTranslation } from '@/lib/i18n/context';
import { dateFnsLocales } from '@/lib/i18n/date-locales';

export default function PriceChart({ prices, stats, pickDate }) {
  const { t, locale } = useTranslation();
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
          <h3>{t('priceChart.noData')}</h3>
          <p>{t('priceChart.noDataDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="route-currency" style={{ padding: '0 0 4px 0' }}>{t('priceChart.allPricesUSD')}</div>
      <div className="route-nonstop" style={{ padding: '0 0 4px 0' }}>{t('priceChart.nonstop')}</div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e8eaed" />
            <XAxis
              dataKey="snapshot"
              tick={{ fontSize: 11, fill: '#5f6368' }}
              tickFormatter={d => format(parseISO(d), locale === 'zh' ? 'M月d日' : 'MMM d', { locale: dateFnsLocales[locale] })}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#5f6368' }}
              tickFormatter={v => formatPrice(v, locale)}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #dadce0', fontSize: 13 }}
              labelFormatter={d => t('priceChart.priceCheck', { date: format(parseISO(d), locale === 'zh' ? 'yyyy年M月d日' : 'MMM d, yyyy', { locale: dateFnsLocales[locale] }) })}
              formatter={(value, name) => [name === 'price' ? formatPrice(value, locale) : value, name === 'price' ? t('priceChart.price') : name]}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              name={t('priceChart.price')}
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
                label={{ value: `${t('priceChart.avg')} ${formatPrice(Math.round(avgPrice), locale)}`, position: 'right', fill: '#1e8e3e', fontSize: 11 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}