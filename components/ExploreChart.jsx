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

export default function ExploreChart({ grouped, stats, routeLabel }) {
  const { t, locale } = useTranslation();
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
          <h3>{t('exploreChart.noData')}</h3>
          <p>{t('exploreChart.noDataDesc')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card">
      <div className="route-info" style={{ marginBottom: 4 }}>
        <strong style={{ fontSize: '0.9rem', fontWeight: 500 }}>{routeLabel}</strong>
        <span className="route-snapshots">{t('exploreChart.departureDates', { count: chartData.length })}</span>
      </div>
      <div className="route-currency" style={{ marginBottom: 12 }}>{t('exploreChart.allPricesUSD')}</div>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 8, right: 16, left: 8, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis
              dataKey="date"
              tick={{ fontSize: 11, fill: '#718096' }}
              tickFormatter={d => format(parseISO(d), locale === 'zh' ? 'M月d日' : 'MMM d', { locale: dateFnsLocales[locale] })}
              interval="preserveStartEnd"
              minTickGap={40}
            />
            <YAxis
              tick={{ fontSize: 11, fill: '#718096' }}
              tickFormatter={v => formatPrice(v, locale)}
              domain={['auto', 'auto']}
            />
            <Tooltip
              contentStyle={{ borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13 }}
              labelFormatter={d => format(parseISO(d), locale === 'zh' ? 'yyyy年M月d日' : 'MMM d, yyyy', { locale: dateFnsLocales[locale] })}
              formatter={(value, name) => {
                const labels = { price: t('exploreChart.avgPrice'), minPrice: t('exploreChart.lowest'), maxPrice: t('exploreChart.highest'), snapshots: t('exploreChart.snapshots') };
                return [name === 'price' ? formatPrice(value, locale) : value, labels[name] || name];
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="price"
              name={t('exploreChart.avgPrice')}
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
                label={{ value: `${t('exploreChart.avg')} ${formatPrice(Math.round(avgPrice), locale)}`, position: 'right', fill: '#1e8e3e', fontSize: 11 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}