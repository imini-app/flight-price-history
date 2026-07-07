'use client';

import { useState, useCallback, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import RoutePicker from '@/components/RoutePicker';
import ExploreChart from '@/components/ExploreChart';
import { fetchRouteData, groupPricesByDeparture, computeStats } from '@/lib/data-utils';
import { useTranslation } from '@/lib/i18n/context';
import { dateFnsLocales } from '@/lib/i18n/date-locales';

function formatRelativeTime(dateStr, t, locale) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return t('time.justNow');
  if (mins < 60) return t('time.minutesAgo', { m: mins });
  const hours = Math.floor(mins / 60);
  if (hours < 24) return t('time.hoursAgo', { h: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return t('time.daysAgo', { d: days });
  return format(parseISO(dateStr), 'MMM d', { locale: dateFnsLocales[locale] });
}

export default function ExplorePage() {
  const { t, locale } = useTranslation();
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
        <h2>{t('explore.title')}</h2>
        <p>{t('explore.subtitle')}</p>
      </div>

      <RoutePicker
        onSelect={handleSelect}
        onSubmit={handleSubmit}
        showDate={false}
        defaultOrigin={defaultOrigin}
        defaultDest={defaultDest}
        helpContent={
          <div className="guide">
            <h3>{t('explore.guideTitle')}</h3>
            <p>{t('explore.guideDesc')}</p>
            <div className="examples">
              <div className="example">
                <div>
                  <strong>{t('explore.cheapestSeason')}</strong>
                  <p>{t('explore.cheapestSeasonDesc')}</p>
                </div>
              </div>
              <div className="example">
                <div>
                  <strong>{t('explore.holidaySpikes')}</strong>
                  <p>{t('explore.holidaySpikesDesc')}</p>
                </div>
              </div>
              <div className="example">
                <div>
                  <strong>{t('explore.multipleSnapshots')}</strong>
                  <p>{t('explore.multipleSnapshotsDesc')}</p>
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
            <p>{t('explore.loading')}</p>
          </div>
        </div>
      )}

      {!loading && routeKey && grouped.length === 0 && !error && (
        <div className="card">
          <div className="empty-state">
            <h3>{t('explore.noData')}</h3>
            <p>{t('explore.noDataDesc')}</p>
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
          <h3 className="recent-checks-title">{t('explore.recentChecks')}</h3>
          {recentChecks.length > 0 ? (
            <div className="recent-checks-list">
              {recentChecks.map((c, i) => {
                const [origin, dest] = c.route_key.split('-');
                return (
                  <a key={i} className="recent-check-item" href={`/explore?origin=${origin}&dest=${dest}`}>
                    <span className="rc-route">{c.route_label}</span>
                    {c.travel_date && <span className="rc-date">{c.travel_date}</span>}
                    <span className="rc-time">{formatRelativeTime(c.created_at, t, locale)}</span>
                  </a>
                );
              })}
            </div>
          ) : (
            <div className="recent-checks-empty">{t('explore.noChecks')}</div>
          )}
        </div>
      )}
    </main>
  );
}