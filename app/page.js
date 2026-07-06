'use client';

import { useState, useCallback, useEffect } from 'react';
import RoutePicker from '@/components/RoutePicker';
import PriceChart from '@/components/PriceChart';
import StatsCards from '@/components/StatsCards';
import { fetchRouteData, filterPricesByDepartureDate, computeSnapshotStats } from '@/lib/data-utils';

export default function Home() {
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
    <>
      <header>
        <h1>✈ Flight Price History</h1>
        <p>Daily price snapshots for major international routes — see how fares change over time</p>
      </header>

      <main className="container" style={{ marginTop: 24 }}>
        <RoutePicker onSelect={handleSelect} />

        <div className="card guide">
          <h3>How it works</h3>
          <p>Pick a route and a future departure date. Each day, a snapshot records the lowest nonstop round-trip price for that departure. The chart shows how the price has trended over time, so you can decide whether to <strong>buy now</strong> or <strong>wait</strong>.</p>
          <div className="examples">
            <div className="example">
              <span className="example-icon">📈</span>
              <div>
                <strong>London → New York, Dec 20</strong>
                <p>If the price was $580 in July but rose to $720 in August, the trend suggests buying earlier was better.</p>
              </div>
            </div>
            <div className="example">
              <span className="example-icon">📉</span>
              <div>
                <strong>Hong Kong → Tokyo, Sep 1</strong>
                <p>If the price dropped from $305 to $252 over several weeks, waiting may have saved you money.</p>
              </div>
            </div>
          </div>
        </div>

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
    </>
  );
}
