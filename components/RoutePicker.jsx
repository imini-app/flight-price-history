'use client';

import { useState, useEffect, useCallback } from 'react';
import { fetchRoutes, buildOriginIndex } from '@/lib/data-utils';

export default function RoutePicker({ onSelect, defaultOrigin, defaultDest }) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!selectedOrigin || !selectedDest || !pickDate) return;
    const route = routes.find(r => r.origin === selectedOrigin && r.dest === selectedDest);
    if (route) onSelect(route.key, pickDate);
  };

  if (loading) {
    return (
      <div className="card">
        <div className="loading"><div className="spinner" /></div>
      </div>
    );
  }

  return (
    <form className="card" onSubmit={handleSubmit}>
      <div className="controls">
        <div className="control-group">
          <label>Origin</label>
          <select value={selectedOrigin} onChange={handleOriginChange}>
            <option value="">Select origin...</option>
            {origins.map(o => (
              <option key={o.code} value={o.code}>
                {o.city} ({o.code}), {o.country}
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Destination</label>
          <select value={selectedDest} onChange={e => setSelectedDest(e.target.value)} disabled={!selectedOrigin}>
            <option value="">Select destination...</option>
            {destinations.map(d => (
              <option key={d.code} value={d.code}>
                {d.city} ({d.code}), {d.country}
              </option>
            ))}
          </select>
        </div>
        <div className="control-group">
          <label>Departure Date</label>
          <input type="date" value={pickDate} onChange={e => setPickDate(e.target.value)} />
        </div>
        <button type="submit" className="btn btn-primary" disabled={!selectedOrigin || !selectedDest || !pickDate}>
          Show Trend
        </button>
      </div>
    </form>
  );
}
