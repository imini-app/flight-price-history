'use client';

import { useState, useMemo } from 'react';
import { format, startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay } from 'date-fns';

export default function CalendarPicker({ datePrices, selectedDate, onSelect }) {
  const defaultMonth = selectedDate || datePrices[0]?.date;
  const [viewMonth, setViewMonth] = useState(() => {
    const d = new Date(defaultMonth);
    return { year: d.getFullYear(), month: d.getMonth() };
  });

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

  const prevMonth = () => {
    setViewMonth(v => {
      if (v.month === 0) return { year: v.year - 1, month: 11 };
      return { year: v.year, month: v.month - 1 };
    });
  };

  const nextMonth = () => {
    setViewMonth(v => {
      if (v.month === 11) return { year: v.year + 1, month: 0 };
      return { year: v.year, month: v.month + 1 };
    });
  };

  const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const yearOptions = useMemo(() => {
    const years = [];
    const minYear = new Date(datePrices[0]?.date).getFullYear();
    const maxYear = new Date(datePrices[datePrices.length - 1]?.date).getFullYear();
    for (let y = minYear; y <= maxYear; y++) years.push(y);
    return years;
  }, [datePrices]);

  const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="calendar-picker">
      <div className="cal-header">
        <button type="button" className="cal-nav" onClick={prevMonth} aria-label="Previous month">{'\u276E'}</button>
        <select className="cal-month-select" value={viewMonth.month} onChange={e => setViewMonth(v => ({ ...v, month: Number(e.target.value) }))}>
          {months.map((m, i) => (
            <option key={m} value={i}>{m}</option>
          ))}
        </select>
        <select className="cal-year-select" value={viewMonth.year} onChange={e => setViewMonth(v => ({ ...v, year: Number(e.target.value) }))}>
          {yearOptions.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
        <button type="button" className="cal-nav" onClick={nextMonth} aria-label="Next month">{'\u276F'}</button>
      </div>
      <button type="button" className="cal-today-btn" onClick={() => {
        const d = new Date();
        const key = format(d, 'yyyy-MM-dd');
        if (priceMap[key]) { onSelect(key); }
        else { setViewMonth({ year: d.getFullYear(), month: d.getMonth() }); }
      }}>Today</button>
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
            {d.price && <span className="cal-day-price">${d.price}</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
