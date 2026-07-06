'use client';

import { useState, useCallback, useEffect } from 'react';
import RoutePicker from '@/components/RoutePicker';
import ExploreChart from '@/components/ExploreChart';
import { fetchRouteData, groupPricesByDeparture, computeStats } from '@/lib/data-utils';

export default function ExplorePage() {
  const [routeKey, setRouteKey] = useState(null);
  const [grouped, setGrouped] = useState([]);
  const [stats, setStats] = useState(null);
  const [routeLabel, setRouteLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSelect = useCallback((key, _date, label) => {
    setRouteKey(key);
    if (label) setRouteLabel(label);
  }, []);

  useEffect(() => {
    if (!routeKey) return;
    setLoading(true);
    setError(null);

    fetchRouteData(routeKey)
      .then(data => {
        const g = groupPricesByDeparture(data.prices);
        const s = computeStats(data.prices);
        setGrouped(g);
        setStats(s);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [routeKey]);

  return (
    <main className="container">
      <div className="page-header">
        <h2>Explore Route Prices</h2>
        <p>Compare average prices across different travel dates to find the cheapest time to fly.</p>
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