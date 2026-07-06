'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import RoutePicker from '@/components/RoutePicker';
import PriceHistoryChart from '@/components/PriceHistoryChart';
import StatsCards from '@/components/StatsCards';
import { fetchRouteData } from '@/lib/data-utils';

function getLatestPricePerDate(prices) {
  const byDate = {};
  for (const p of prices) {
    if (!p.snapshot) continue;
    const key = p.date;
    if (!byDate[key] || p.snapshot > byDate[key].snapshot) {
      byDate[key] = p;
    }
  }
  return Object.values(byDate).sort((a, b) => a.date.localeCompare(b.date));
}

function computeHistoryStats(prices) {
  if (!prices || prices.length === 0) return null;
  const vals = prices.map(p => p.price);
  return {
    min: Math.min(...vals),
    max: Math.max(...vals),
    avg: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length * 10) / 10,
    count: vals.length,
  };
}

export default function Home() {
  const [routeKey, setRouteKey] = useState(null);
  const [latestPrices, setLatestPrices] = useState([]);
  const [stats, setStats] = useState(null);
  const [routeLabel, setRouteLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = useCallback((key) => {
    setRouteKey(key);
  }, []);

  useEffect(() => {
    if (!routeKey) return;
    setLoading(true);
    setError(null);

    fetchRouteData(routeKey)
      .then(data => {
        const byDate = getLatestPricePerDate(data.prices);
        const s = computeHistoryStats(byDate);
        setLatestPrices(byDate);
        setStats(s);
        setRouteLabel(data.label);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [routeKey]);

  return (
    <main className="container">
      <div className="hero">
        <h1>Flight Price History</h1>
        <p className="hero-sub">
          See the latest prices across all travel dates for any route. Pick a route to find the best time to fly.
        </p>
      </div>

      <RoutePicker onSelect={handleSelect} showDate={false} />

      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="card">
          <div className="loading">
            <div className="spinner" />
            <p>Loading price data...</p>
          </div>
        </div>
      )}

      {!loading && routeKey && latestPrices.length === 0 && !error && (
        <div className="card">
          <div className="empty-state">
            <h3>No data available</h3>
            <p>We haven't collected price data for this route yet. Data is gathered once a day — check back soon!</p>
          </div>
        </div>
      )}

      {!loading && stats && (
        <div>
          <PriceHistoryChart prices={latestPrices} stats={stats} routeLabel={routeLabel} />
        </div>
      )}
    </main>
  );
}