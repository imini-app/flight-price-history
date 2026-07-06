'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { fetchRoutes, buildOriginIndex } from '@/lib/data-utils';
import SearchableSelect from './SearchableSelect';
import CalendarPicker from './CalendarPicker';
import { loadPickerState, savePickerState } from '@/lib/storage';

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
  const [dateSearch, setDateSearch] = useState('');
  const dateSearchRef = useRef(null);
  const popupRef = useRef(null);

  const handleDateSearch = useCallback((e) => {
    const val = e.target.value;
    setDateSearch(val);
    if (!val) return;
    const trimmed = val.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      if (availableDates.includes(trimmed)) {
        setPickDate(trimmed);
        setShowDatePopup(false);
        setDateSearch('');
      }
    }
  }, [availableDates]);

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

  useEffect(() => {
    if (loading) return;
    const saved = loadPickerState();
    if (saved.origin) {
      setSelectedOrigin(saved.origin);
      const found = origins.find(o => o.code === saved.origin);
      if (found) {
        setDestinations(found.destinations || []);
        if (saved.dest) setSelectedDest(saved.dest);
      }
      if (saved.date && showDate) {
        const d = new Date(saved.date);
        if (!isNaN(d.getTime())) setPickDate(saved.date);
      }
    }
  }, [loading]);

  useEffect(() => {
    if (!loading && selectedOrigin && selectedDest) {
      const route = routes.find(r => r.origin === selectedOrigin && r.dest === selectedDest);
      if (route) {
        const state = { origin: selectedOrigin, dest: selectedDest, routeLabel: route.label };
        if (showDate) state.date = pickDate;
        savePickerState(state);
      }
    }
  }, [selectedOrigin, selectedDest, pickDate]);

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
    dateSearchRef.current?.focus();
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setShowDatePopup(false);
        setDateSearch('');
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
              <button
                type="button"
                className="date-picker-display"
                onClick={() => setShowDatePopup(v => !v)}
              >
                <span className="dpd-label">{new Date(pickDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
                {dateInfo && (
                  <span className={`dpd-badge dpd-badge-${dateInfo.type}`}>
                    {dateInfo.type === 'loading' && '\u23F3'}
                    {dateInfo.type === 'none' && '\u26A0'}
                    {dateInfo.type === 'available' && `${dateInfo.count}`}
                  </span>
                )}
              </button>
              {showDatePopup && dateInfo?.type === 'available' && (
                <div className="date-picker-popup">
                  <div className="dpp-search">
                    <input
                      ref={dateSearchRef}
                      type="text"
                      className="dpp-search-input"
                      placeholder="Search date (e.g. 2026-12-25 or Dec 25, 2026)"
                      value={dateSearch}
                      onChange={handleDateSearch}
                      onKeyDown={e => {
                        if (e.key === 'Enter' && dateSearch.trim()) {
                          const val = dateSearch.trim();
                          const parsed = new Date(val);
                          if (!isNaN(parsed.getTime())) {
                            const key = parsed.toISOString().split('T')[0];
                            if (availableDates.includes(key)) {
                              setPickDate(key);
                              setShowDatePopup(false);
                              setDateSearch('');
                            }
                          }
                        }
                        if (e.key === 'Escape') { setShowDatePopup(false); setDateSearch(''); }
                      }}
                    />
                  </div>
                  <CalendarPicker
                    datePrices={datePrices}
                    selectedDate={pickDate}
                    onSelect={d => { setPickDate(d); setShowDatePopup(false); setDateSearch(''); }}
                  />
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