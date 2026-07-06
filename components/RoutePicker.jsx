'use client';

import { useState, useEffect, useCallback } from 'react';
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
    const route = routes.find(r => r.origin === selectedOrigin && r.dest === selectedDest);
    if (route) onSelect(route.key, showDate ? pickDate : null, route.label);
  };

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
          <div className="search-field">
            <label>Travel Date</label>
            <input type="date" value={pickDate} onChange={e => setPickDate(e.target.value)} />
          </div>
        )}
        <div className="search-field">
          <label>&nbsp;</label>
          <button type="submit" className="btn btn-primary" disabled={!selectedOrigin || !selectedDest || (showDate && !pickDate)}>
            {showDate ? 'Show Trend' : 'View Prices'}
          </button>
        </div>
      </div>
    </form>
  );
}