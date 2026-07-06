'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';
import { formatPrice } from '@/lib/format';

function parseLocalDate(str) {
  if (!str) return new Date(NaN);
  const [y, m, d] = str.split('-').map(Number);
  return new Date(y, m - 1, d);
}

export default function CalendarPicker({ datePrices, selectedDate, onSelect }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const d = selectedDate ? parseLocalDate(selectedDate) : parseLocalDate(datePrices[0]?.date);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

  useEffect(() => {
    if (selectedDate) {
      const d = parseLocalDate(selectedDate);
      setViewMonth({ year: d.getFullYear(), month: d.getMonth() });
    }
  }, [selectedDate]);

  const priceMap = useMemo(() => {
    const map = {};
    for (const d of datePrices) {
      map[d.date] = d.avgPrice;
    }
    return map;
  }, [datePrices]);

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(new Date(viewMonth.year, viewMonth.month)));
    const end = endOfWeek(endOfMonth(new Date(viewMonth.year, viewMonth.month)));
    return eachDayOfInterval({ start, end }).map(date => {
      const key = format(date, 'yyyy-MM-dd');
      return {
        date: key,
        dayNum: date.getDate(),
        price: priceMap[key] || null,
        isCurrentMonth: isSameMonth(date, new Date(viewMonth.year, viewMonth.month)),
        isSelected: selectedDate === key,
        isToday: isSameDay(date, new Date()),
      };
    });
  }, [viewMonth, priceMap, selectedDate]);

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const yearOptions = useMemo(() => {
    const years = [];
    if (!datePrices.length) return years;
    const minYear = parseLocalDate(datePrices[0].date).getFullYear();
    const maxYear = parseLocalDate(datePrices[datePrices.length - 1].date).getFullYear();
    for (let y = minYear; y <= maxYear; y++) years.push(y);
    return years;
  }, [datePrices]);

  const goToMonth = useCallback((e) => {
    setViewMonth(v => ({ year: v.year, month: parseInt(e.target.value, 10) }));
  }, []);

  const goToYear = useCallback((e) => {
    setViewMonth(v => ({ year: parseInt(e.target.value, 10), month: v.month }));
  }, []);

  const prevMonth = useCallback(() => {
    setViewMonth(v => {
      if (v.month === 0) return { year: v.year - 1, month: 11 };
      return { year: v.year, month: v.month - 1 };
    });
  }, []);

  const nextMonth = useCallback(() => {
    setViewMonth(v => {
      if (v.month === 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: v.month + 1 };
    });
  }, []);

  const goToday = useCallback(() => {
    const d = new Date();
    const key = format(d, 'yyyy-MM-dd');
    if (priceMap[key]) onSelect(key);
    else setViewMonth({ year: d.getFullYear(), month: d.getMonth() });
  }, [priceMap, onSelect]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-picker">
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={prevMonth} aria-label="Previous month">{'\u276E'}</button>
        <select className="cal-month-select" value={viewMonth.month} onChange={goToMonth}>
          {months.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>
        <select className="cal-year-select" value={viewMonth.year} onChange={goToYear}>
          {yearOptions.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button type="button" className="cal-nav" onClick={nextMonth} aria-label="Next month">{'\u276F'}</button>
      </div>
      <button type="button" className="cal-today-btn" onClick={goToday}>Today</button>
      <div className="cal-weekdays">
        {weekdays.map(wd => (
          <span key={wd} className="cal-weekday">{wd}</span>
        ))}
      </div>
      <div className="cal-grid">
        {days.map(d => (
          <button
            key={d.date}
            type="button"
            className={
              'cal-day' +
              (!d.isCurrentMonth ? ' cal-day-other' : '') +
              (d.isSelected ? ' cal-day-selected' : '') +
              (d.isToday && !d.isSelected ? ' cal-day-today' : '') +
              (d.isCurrentMonth && !d.price ? ' cal-day-empty' : '') +
              (d.isCurrentMonth && d.price ? ' cal-day-has' : '')
            }
            disabled={!d.price || !d.isCurrentMonth}
            onClick={() => { if (d.price) onSelect(d.date); }}
          >
            <span className="cal-day-num">{d.dayNum}</span>
            {d.price && <span className="cal-day-price">{formatPrice(d.price)}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
