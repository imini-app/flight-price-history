'use client';

import { useState, useCallback, useEffect } from 'react';
import RoutePicker from '@/components/RoutePicker';
import PriceChart from '@/components/PriceChart';
import StatsCards from '@/components/StatsCards';
import { fetchRouteData, filterPricesByDateRange, computeStats } from '@/lib/data-utils';

export default function Home() {
  const [routeKey, setRouteKey] = useState(null);
  const [pickDate, setPickDate] = useState(null);
  const [prices, setPrices] = useState([]);
  const [stats, setStats] = useState(null);
  const [routeLabel, setRouteLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = useCallback((key, date) => {
    setRouteKey(key);
    setPickDate(date);
  }, []);

  useEffect(() => {
    if (!routeKey || !pickDate) return;
    setLoading(true);
    setError(null);

    fetchRouteData(routeKey)
      .then(data => {
        const filtered = filterPricesByDateRange(data.prices, pickDate, 12);
        const s = computeStats(filtered);
        setPrices(filtered);
        setStats(s);
        setRouteLabel(data.label);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [routeKey, pickDate]);

  return (
    <>
      <header>
        <h1>✈ Flight Price History</h1>
        <p>Explore historic airfare trends for major international routes</p>
      </header>

      <main className="container" style={{ marginTop: 24 }}>
        <RoutePicker onSelect={handleSelect} />

        {error && <div className="error-banner">{error}</div>}

        {loading && (
          <div className="card">
            <div className="loading">
              <div className="spinner" />
              <p>Loading price data...</p>
            </div>
          </div>
        )}

        {!loading && routeKey && prices.length === 0 && !error && (
          <div className="card">
            <div className="empty-state">
              <h3>No data available</h3>
              <p>No price data found for this route in the selected date range.</p>
            </div>
          </div>
        )}

        {!loading && stats && (
          <div>
            <StatsCards stats={stats} prices={prices} routeLabel={routeLabel} dateRange={pickDate} />
            <PriceChart prices={prices} stats={stats} />
          </div>
        )}
      </main>
    </>
  );
}
