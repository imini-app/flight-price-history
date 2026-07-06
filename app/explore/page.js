'use client';

import { useState, useCallback, useEffect } from 'react';
import RoutePicker from '@/components/RoutePicker';
import ExploreChart from '@/components/ExploreChart';
import { fetchRouteData, groupPricesByDeparture, computeStats } from '@/lib/data-utils';

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

export default function ExplorePage() {
  const [routeKey, setRouteKey] = useState(null);
  const [grouped, setGrouped] = useState([]);
  const [stats, setStats] = useState(null);
  const [routeLabel, setRouteLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [defaultOrigin, setDefaultOrigin] = useState('');
  const [defaultDest, setDefaultDest] = useState('');

  const [recentChecks, setRecentChecks] = useState([]);
  const [recentChecksLoading, setRecentChecksLoading] = useState(true);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setDefaultOrigin(params.get('origin') || '');
    setDefaultDest(params.get('dest') || '');
    fetchRecentChecks();
  }, []);

  async function fetchRecentChecks() {
    try {
      const res = await fetch('/api/checks?type=route_history');
      if (res.ok) setRecentChecks(await res.json());
      else console.error('Failed to fetch recent checks:', res.status, await res.text().catch(() => ''));
    } catch (err) {
      console.error('Failed to fetch recent checks:', err);
    } finally {
      setRecentChecksLoading(false);
    }
  }

  const handleSelect = useCallback((key, _date, label) => {
    setRouteKey(key);
    if (label) setRouteLabel(label);
  }, []);

  const handleSubmit = useCallback((key, date, label) => {
    fetch('/api/checks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ routeKey: key, routeLabel: label, travelDate: date, checkType: 'route_history' }),
    }).then(res => {
      if (res.ok) fetchRecentChecks();
      else console.error('Failed to save check:', res.status);
    }).catch(err => {
      console.error('Failed to save check:', err);
    });
  }, []);

  useEffect(() => {
    if (!routeKey) return;
    const parts = routeKey.split('-');
    const origin = parts[0];
    const dest = parts[1];
    const params = new URLSearchParams();
    params.set('origin', origin);
    params.set('dest', dest);
    window.history.replaceState(null, '', `${window.location.pathname}?${params.toString()}`);
  }, [routeKey]);

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
        <h2>Explore route price history</h2>
        <p>Compare price history across different travel dates to find the cheapest time to fly.</p>
      </div>

      <RoutePicker onSelect={handleSelect} onSubmit={handleSubmit} showDate={false} defaultOrigin={defaultOrigin} defaultDest={defaultDest} />

      {!routeKey && !loading && (
        <div className="card guide">
          <h3>How to Use Route History</h3>
          <p>Browse average prices across every departure date we have data for. Spot the cheapest seasons, months, and days for your route at a glance.</p>
          <div className="examples">
            <div className="example">
              <div className="example-icon">{'\u2601'}</div>
              <div>
                <strong>Find the Cheapest Season</strong>
                <p>Scan the chart for the lowest points on the line — those are the departure dates with the lowest average prices. Plan your trip around those periods.</p>
              </div>
            </div>
            <div className="example">
              <div className="example-icon">{'\u2605'}</div>
              <div>
                <strong>Spot Holiday Spikes</strong>
                <p>Notice price bumps around holidays like Christmas or summer. The chart makes it obvious when demand (and prices) peak so you can avoid those windows.</p>
              </div>
            </div>
            <div className="example">
              <div className="example-icon">{'\u2261'}</div>
              <div>
                <strong>Check Multiple Snapshot Averages</strong>
                <p>Each departure date point is the average of all snapshots collected for that date. More snapshots mean a more reliable price signal.</p>
              </div>
            </div>
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

      {!recentChecksLoading && (
        <div className="card recent-checks">
          <h3 className="recent-checks-title">Recent Route History Checks</h3>
          {recentChecks.length > 0 ? (
            <div className="recent-checks-list">
              {recentChecks.map((c, i) => {
                const [origin, dest] = c.route_key.split('-');
                return (
                  <a key={i} className="recent-check-item" href={`/explore?origin=${origin}&dest=${dest}`}>
                    <span className="rc-route">{c.route_label}</span>
                    {c.travel_date && <span className="rc-date">{c.travel_date}</span>}
                    <span className="rc-time">{formatRelativeTime(c.created_at)}</span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="recent-checks-empty">No checks yet — select a route and click View Prices.</div>
          )}
        </div>
      )}
    </main>
  );
}