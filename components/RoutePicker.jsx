'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchRoutes, buildOriginIndex } from '@/lib/data-utils';
import SearchableSelect from './SearchableSelect';

export default function RoutePicker({ onSelect, defaultOrigin, defaultDest, showDate = true }) {
  const [origins, setOrigins] = useState([]);
  const [destinations, setDestinations] = useState([]);
  const [selectedOrigin, setSelectedOrigin] = useState(defaultOrigin || '');
  const [selectedDest, setSelectedDest] = useState(defaultDest || '');
  const [pickDate, setPickDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 60);
    return d.toISOString().split('T')[0];
  });
  const [loading, setLoading] = useState(true);
  const [routes, setRoutes] = useState([]);
  const [availableDates, setAvailableDates] = useState([]);
  const [datePrices, setDatePrices] = useState([]);
  const [routeDataLoading, setRouteDataLoading] = useState(false);
  const [showDatePopup, setShowDatePopup] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!selectedOrigin || !selectedDest || !routes.length) {
      setAvailableDates([]);
      setDatePrices([]);
      return;
    }
    const route = routes.find(r => r.origin === selectedOrigin && r.dest === selectedDest);
    if (!route) {
      setAvailableDates([]);
      setDatePrices([]);
      return;
    }
    setRouteDataLoading(true);
    fetch(`/data/${route.key}.json`)
      .then(res => {
        if (!res.ok) throw new Error('No data');
        return res.json();
      })
      .then(data => {
        const groups = {};
        for (const p of data.prices) {
          if (!p.snapshot) continue;
          if (!groups[p.date]) groups[p.date] = [];
          groups[p.date].push(p.price);
        }
        const entries = Object.entries(groups)
          .map(([date, vals]) => ({
            date,
            avgPrice: Math.round(vals.reduce((a, b) => a + b, 0) / vals.length),
          }))
          .sort((a, b) => a.date.localeCompare(b.date));
        setAvailableDates(entries.map(e => e.date));
        setDatePrices(entries);
        setRouteDataLoading(false);
        if (!entries.find(e => e.date === pickDate)) {
          setPickDate(entries[0]?.date || pickDate);
        }
      })
      .catch(() => {
        setAvailableDates([]);
        setDatePrices([]);
        setRouteDataLoading(false);
      });
  }, [selectedOrigin, selectedDest, routes]);

  useEffect(() => {
    fetchRoutes()
      .then(data => {
        setRoutes(data);
        const idx = buildOriginIndex(data);
        setOrigins(idx);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleOriginChange = useCallback((e) => {
    const code = e.target.value;
    setSelectedOrigin(code);
    setSelectedDest('');
    setDestinations(code ? (origins.find(o => o.code === code)?.destinations || []) : []);
  }, [origins]);

  const handleDestChange = useCallback((e) => {
    setSelectedDest(e.target.value);
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrigin || !selectedDest) return;
    if (showDate && !pickDate) return;
    if (showDate && availableDates.length && !availableDates.includes(pickDate)) return;
    const route = routes.find(r => r.origin === selectedOrigin && r.dest === selectedDest);
    if (route) onSelect(route.key, showDate ? pickDate : null, route.label);
  };

  useEffect(() => {
    if (!showDatePopup) return;
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowDatePopup(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [showDatePopup]);

  const dateInfo = useMemo(() => {
    if (!showDate || !selectedOrigin || !selectedDest) return null;
    if (routeDataLoading) return { type: 'loading' };
    if (!availableDates.length && !routeDataLoading) return { type: 'none' };
    return {
      type: 'available',
      count: availableDates.length,
      min: availableDates[0],
      max: availableDates[availableDates.length - 1],
    };
  }, [showDate, selectedOrigin, selectedDest, availableDates, routeDataLoading]);

  const originOptions = origins.map(o => ({
    value: o.code,
    label: `${o.city} (${o.code}), ${o.country}`,
  }));

  const destOptions = destinations.map(d => ({
    value: d.code,
    label: `${d.city} (${d.code}), ${d.country}`,
  }));

  if (loading) {
    return (
      <div className="card">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <form className="search-card" onSubmit={handleSubmit}>
      <div className="search-row">
        <div className="search-field">
          <label>Origin</label>
          <SearchableSelect
            options={originOptions}
            value={selectedOrigin}
            onChange={handleOriginChange}
            placeholder="Select origin..."
          />
        </div>
        <div className="search-field">
          <label>Destination</label>
          <SearchableSelect
            options={destOptions}
            value={selectedDest}
            onChange={handleDestChange}
            placeholder="Select destination..."
            disabled={!selectedOrigin}
          />
        </div>
        {showDate && (
          <div className="search-field search-field-date">
            <label>Travel Date</label>
            <div className="date-picker-wrap" ref={popupRef}>
              <input
                type="date"
                value={pickDate}
                onChange={e => setPickDate(e.target.value)}
                onFocus={() => setShowDatePopup(true)}
                min={dateInfo?.type === 'available' ? dateInfo.min : undefined}
                max={dateInfo?.type === 'available' ? dateInfo.max : undefined}
              />
              {dateInfo && (
                <button
                  type="button"
                  className="date-picker-badge"
                  onClick={() => setShowDatePopup(v => !v)}
                  aria-label="Toggle date availability"
                >
                  {dateInfo.type === 'loading' && '\u23F3'}
                  {dateInfo.type === 'none' && '\u26A0'}
                  {dateInfo.type === 'available' && `${dateInfo.count}`}
                </button>
              )}
              {showDatePopup && dateInfo?.type === 'available' && (
                <div className="date-picker-popup">
                  <div className="dpp-header">
                    <span className="dpp-title">Available departure dates</span>
                    <span className="dpp-range">
                      {new Date(dateInfo.min).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} – {new Date(dateInfo.max).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </span>
                  </div>
                  <div className="date-price-list">
                    {datePrices.map(d => (
                      <button
                        key={d.date}
                        type="button"
                        className={`date-price-chip${d.date === pickDate ? ' selected' : ''}`}
                        onClick={() => { setPickDate(d.date); setShowDatePopup(false); }}
                      >
                        <span className="dpc-date">{new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span className="dpc-price">${d.avgPrice}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {showDatePopup && dateInfo?.type === 'loading' && (
                <div className="date-picker-popup">
                  <div className="dpp-loading">Loading available dates...</div>
                </div>
              )}
              {showDatePopup && dateInfo?.type === 'none' && (
                <div className="date-picker-popup">
                  <div className="dpp-none">No price data collected for this route yet.</div>
                </div>
              )}
            </div>
          </div>
        )}
        <div className="search-field">
          <label>&nbsp;</label>
          <button type="submit" className="btn btn-primary" disabled={!selectedOrigin || !selectedDest || (showDate && !pickDate) || (showDate && availableDates.length > 0 && !availableDates.includes(pickDate))}>
            {showDate ? 'Show Trend' : 'View Prices'}
          </button>
        </div>
      </div>
    </form>
  );
}