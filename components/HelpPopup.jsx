'use client';

import { useState, useEffect, useRef } from 'react';

export default function HelpPopup({ children }) {
  const [open, setOpen] = useState(false);
  const popupRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (popupRef.current && !popupRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <span className="help-popup-wrap" ref={popupRef}>
      <button
        type="button"
        className="help-btn"
        onClick={() => setOpen(v => !v)}
        aria-label="Help"
      >
        ?
      </button>
      {open && (
        <div className="help-popup">
          <button type="button" className="help-close" onClick={() => setOpen(false)}>
            &times;
          </button>
          {children}
        </div>
      )}
    </span>
  );
}
