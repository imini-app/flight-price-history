'use client';

import { useState, useRef, useEffect, useMemo, useCallback } from 'react';

export default function SearchableSelect({ options, value, onChange, placeholder, disabled }) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  const selected = options.find(o => o.value === value);

  const filtered = useMemo(() => {
    if (!query) return options;
    const q = query.toLowerCase();
    return options.filter(o => o.label.toLowerCase().includes(q));
  }, [options, query]);

  useEffect(() => {
    if (!open) { setHighlighted(0); return; }
    setHighlighted(0);
  }, [open, filtered.length]);

  useEffect(() => {
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
        setQuery('');
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const select = useCallback((opt) => {
    onChange({ target: { value: opt.value } });
    setOpen(false);
    setQuery('');
    inputRef.current?.blur();
  }, [onChange]);

  const handleKey = useCallback((e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted(i => Math.min(i + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered[highlighted]) select(filtered[highlighted]);
    } else if (e.key === 'Escape') {
      setOpen(false);
      setQuery('');
      inputRef.current?.blur();
    }
  }, [filtered, highlighted, select]);

  return (
    <div className="searchable-select" ref={containerRef}>
      <input
        ref={inputRef}
        type="text"
        className="searchable-input"
        value={open ? query : (selected ? selected.label : '')}
        placeholder={placeholder}
        disabled={disabled}
        onFocus={() => { if (!disabled) { setOpen(true); setQuery(''); } }}
        onChange={e => { setQuery(e.target.value); setOpen(true); }}
        onKeyDown={handleKey}
        autoComplete="off"
      />
      <span className="searchable-arrow">▾</span>
      {open && !disabled && (
        <ul className="searchable-dropdown">
          {filtered.length === 0 && (
            <li className="searchable-empty">No results</li>
          )}
          {filtered.map((opt, i) => (
            <li
              key={opt.value}
              className={`searchable-option ${i === highlighted ? 'highlighted' : ''} ${opt.value === value ? 'selected' : ''}`}
              onMouseDown={() => select(opt)}
              onMouseEnter={() => setHighlighted(i)}
            >
              {opt.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}