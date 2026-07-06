'use client';

import { useState, useCallback, useEffect } from 'react';
import RoutePicker from '@/components/RoutePicker';
import PriceChart from '@/components/PriceChart';
import StatsCards from '@/components/StatsCards';
import { fetchRouteData, filterPricesByDepartureDate, computeSnapshotStats } from '@/lib/data-utils';

function formatRelativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function Home() {
  const [routeKey, setRouteKey] = useState(null);
  const [pickDate, setPickDate] = useState(null);
  const [snapshotPrices, setSnapshotPrices] = useState([]);
  const [stats, setStats] = useState(null);
  const [routeLabel, setRouteLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [defaultOrigin, setDefaultOrigin] = useState('');
  const [defaultDest, setDefaultDest] = useState('');
  const [defaultDate, setDefaultDate] = useState('');

  const [recentChecks, setRecentChecks] = useState([]);
  const [recentChecksLoading, setRecentChecksLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDefaultOrigin(params.get('origin') || '');
    setDefaultDest(params.get('dest') || '');
    setDefaultDate(params.get('date') || '');
    fetchRecentChecks();
  }, []);

  async function fetchRecentChecks() {
    try {
      const res = await fetch('/api/checks');
      if (res.ok) setRecentChecks(await res.json());
    } catch {} finally {
      setRecentChecksLoading(false);
    }
  }

  const handleSelect = useCallback((key, date, label) => {
    setRouteKey(key);
    setPickDate(date);
    if (label) setRouteLabel(label);
  }, []);

  const handleSubmit = useCallback((key, date, label) => {
    fetch('/api/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeKey: key, routeLabel: label, travelDate: date }),
    }).then(res => {
      if (res.ok) fetchRecentChecks();
    }).catch(() => {});
  }, []);

  useEffect(() => {
    if (!routeKey) return;
    const parts = routeKey.split('-');
    const origin = parts[0];
    const dest = parts[1];
    const params = new URLSearchParams();
    params.set('origin', origin);
    params.set('dest', dest);
    if (pickDate) params.set('date', pickDate);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [routeKey, pickDate]);

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
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [routeKey, pickDate]);

  return (
    <main className="container">
      <div className="hero">
        <h1>Flight Price History</h1>
        <p className="hero-sub">
          See how flight prices change day by day. Pick a route and a departure date to find the best time to book.
        </p>
      </div>

      <RoutePicker onSelect={handleSelect} onSubmit={handleSubmit} defaultOrigin={defaultOrigin} defaultDest={defaultDest} defaultDate={defaultDate} />

      {!routeKey && !loading && (
        <div className="card guide">
          <h3>How to Use Price Check</h3>
          <p>Track how flight prices for a specific departure date have changed over time. This helps you decide whether to book now or wait for a better deal.</p>
          <div className="examples">
            <div className="example">
              <div className="example-icon">{'\u2708'}</div>
              <div>
                <strong>Find the Best Time to Book</strong>
                <p>Select your route and travel date, then view the price trend. If prices are trending down, you may want to wait. If they&apos;re rising, consider booking soon.</p>
              </div>
            </div>
            <div className="example">
              <div className="example-icon">{'\u2193'}</div>
              <div>
                <strong>Monitor Price Drops</strong>
                <p>Check back daily — each new snapshot adds a point to the chart. You&apos;ll see exactly when prices dropped and by how much.</p>
              </div>
            </div>
            <div className="example">
              <div className="example-icon">{'\u2194'}</div>
              <div>
                <strong>Compare Nearby Dates</strong>
                <p>Try different departure dates to see how shifting your trip by a day or two affects the price history and current fare.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!recentChecksLoading && recentChecks.length > 0 && (
        <div className="card recent-checks">
          <h3 className="recent-checks-title">Recent Price Checks</h3>
          <div className="recent-checks-list">
            {recentChecks.map((c, i) => (
              <div key={i} className="recent-check-item">
                <span className="rc-route">{c.route_label}</span>
                <span className="rc-date">{c.travel_date}</span>
                <span className="rc-time">{formatRelativeTime(c.created_at)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <p>We haven't collected price data for {pickDate} yet. Data is gathered once a day — check back tomorrow!</p>
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
