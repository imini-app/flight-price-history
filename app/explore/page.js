'use client';

import { useState, useCallback, useEffect, useMemo } from 'react';
import RoutePicker from '@/components/RoutePicker';
import ExploreChart from '@/components/ExploreChart';
import { fetchRouteData, filterPricesByDateRange, groupPricesByDeparture, computeStats } from '@/lib/data-utils';

export default function ExplorePage() {
  const [routeKey, setRouteKey] = useState(null);
  const [pickDate, setPickDate] = useState(null);
  const [grouped, setGrouped] = useState([]);
  const [stats, setStats] = useState(null);
  const [routeLabel, setRouteLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = useCallback((key, date, label) => {
    setRouteKey(key);
    setPickDate(date);
    if (label) setRouteLabel(label);
  }, []);

  const monthsBack = 6;

  useEffect(() => {
    if (!routeKey || !pickDate) return;
    setLoading(true);
    setError(null);

    fetchRouteData(routeKey)
      .then(data => {
        const filtered = filterPricesByDateRange(data.prices, pickDate, monthsBack);
        const g = groupPricesByDeparture(filtered);
        const s = computeStats(filtered);
        setGrouped(g);
        setStats(s);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [routeKey, pickDate]);

  return (
    <main className="container">
      <div className="page-header">
        <h2>Explore Route Prices</h2>
        <p>Compare average prices across different travel dates to find the cheapest time to fly.</p>
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

      {!loading && routeKey && grouped.length === 0 && !error && (
        <div className="card">
          <div className="empty-state">
            <h3>No data available</h3>
            <p>We haven't collected enough data for this route yet. Data is gathered once a day — check back soon!</p>
          </div>
        </div>
      )}

      {!loading && stats && (
        <div>
          <ExploreChart grouped={grouped} stats={stats} routeLabel={routeLabel} />
        </div>
      )}
    </main>
  );
}