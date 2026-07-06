'use client';

import { useState, useCallback, useEffect } from 'react';
import RoutePicker from '@/components/RoutePicker';
import PriceChart from '@/components/PriceChart';
import StatsCards from '@/components/StatsCards';
import { fetchRouteData, filterPricesByDepartureDate, computeSnapshotStats } from '@/lib/data-utils';

export default function TrendPage() {
  const [routeKey, setRouteKey] = useState(null);
  const [pickDate, setPickDate] = useState(null);
  const [snapshotPrices, setSnapshotPrices] = useState([]);
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
        const snaps = filterPricesByDepartureDate(data.prices, pickDate);
        const s = computeSnapshotStats(snaps);
        setSnapshotPrices(snaps);
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
    <main className="container" style={{ marginTop: 24 }}>
      <div className="page-header">
        <h2>Price Trend for a Departure Date</h2>
        <p>See how the price for a specific flight date has changed as daily snapshots were collected.</p>
      </div>

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

      {!loading && routeKey && snapshotPrices.length === 0 && !error && (
        <div className="card">
          <div className="empty-state">
            <h3>No data available</h3>
            <p>No price snapshots found for {pickDate} on this route yet. Check back after the next daily snapshot.</p>
          </div>
        </div>
      )}

      {!loading && stats && (
        <div>
          <StatsCards stats={stats} prices={snapshotPrices} routeLabel={routeLabel} pickDate={pickDate} />
          <PriceChart prices={snapshotPrices} stats={stats} pickDate={pickDate} />
        </div>
      )}
    </main>
  );
}