'use client';

import { useState, useCallback, useEffect } from 'react';
import RoutePicker from '@/components/RoutePicker';
import PriceChart from '@/components/PriceChart';
import PriceTable from '@/components/PriceTable';
import StatsCards from '@/components/StatsCards';
import { fetchRouteData, filterPricesByDepartureDate, computeSnapshotStats } from '@/lib/data-utils';
import { useTranslation } from '@/lib/i18n/context';
import { formatRelativeTime } from '@/lib/format';

export default function Home() {
  const { t, locale } = useTranslation();
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
      const res = await fetch('/api/checks?type=price_check');
      if (res.ok) setRecentChecks(await res.json());
      else console.error('Failed to fetch recent checks:', res.status, await res.text().catch(() => ''));
    } catch (err) {
      console.error('Failed to fetch recent checks:', err);
    } finally {
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
      body: JSON.stringify({ routeKey: key, routeLabel: label, travelDate: date, checkType: 'price_check' }),
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
      <div className="page-header">
        <h2>{t('home.title')}</h2>
        <p>{t('home.subtitle')}</p>
      </div>

      <RoutePicker
        onSelect={handleSelect}
        onSubmit={handleSubmit}
        defaultOrigin={defaultOrigin}
        defaultDest={defaultDest}
        defaultDate={defaultDate}
        helpContent={
          <div className="guide">
            <h3>{t('home.guideTitle')}</h3>
            <p>{t('home.guideDesc')}</p>
            <div className="examples">
              <div className="example">
                <div>
                  <strong>{t('home.findBestTime')}</strong>
                  <p>{t('home.findBestTimeDesc')}</p>
                </div>
              </div>
              <div className="example">
                <div>
                  <strong>{t('home.monitorDrops')}</strong>
                  <p>{t('home.monitorDropsDesc')}</p>
                </div>
              </div>
              <div className="example">
                <div>
                  <strong>{t('home.compareDates')}</strong>
                  <p>{t('home.compareDatesDesc')}</p>
                </div>
              </div>
            </div>
          </div>
        }
      />

      {error && <div className="error-banner">{error}</div>}

      {loading && (
        <div className="card">
          <div className="loading">
            <div className="spinner" />
            <p>{t('home.loading')}</p>
          </div>
        </div>
      )}

      {!loading && routeKey && snapshotPrices.length === 0 && !error && (
        <div className="card">
          <div className="empty-state">
            <h3>{t('home.noData')}</h3>
            <p>{t('home.noDataDesc', { date: pickDate })}</p>
          </div>
        </div>
      )}

      {!loading && stats && (
        <div>
          <StatsCards stats={stats} prices={snapshotPrices} routeLabel={routeLabel} pickDate={pickDate} />
          <div className="chart-table-row">
            <div className="chart-table-col chart-table-col-chart">
              <PriceChart prices={snapshotPrices} stats={stats} pickDate={pickDate} />
            </div>
            <div className="chart-table-col chart-table-col-table">
              <PriceTable prices={snapshotPrices} pickDate={pickDate} />
            </div>
          </div>
        </div>
      )}

      {!recentChecksLoading && (
        <div className="card recent-checks">
          <h3 className="recent-checks-title">{t('home.recentChecks')}</h3>
          {recentChecks.length > 0 ? (
            <div className="recent-checks-list">
              {recentChecks.map((c, i) => {
                const [origin, dest] = c.route_key.split('-');
                return (
                  <a key={i} className="recent-check-item" href={`/?origin=${origin}&dest=${dest}&date=${c.travel_date}`}>
                    <span className="rc-route">{c.route_label}</span>
                    <span className="rc-date">{c.travel_date}</span>
                    <span className="rc-time">{formatRelativeTime(c.created_at, t, locale)}</span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="recent-checks-empty">{t('home.noChecks')}</div>
          )}
        </div>
      )}
    </main>
  );
}
