const KEYS = {
  ORIGIN: 'fph_origin',
  DEST: 'fph_dest',
  DATE: 'fph_date',
  LABEL: 'fph_label',
};

export function loadPickerState() {
  try {
    return {
      origin: localStorage.getItem(KEYS.ORIGIN) || '',
      dest: localStorage.getItem(KEYS.DEST) || '',
      date: localStorage.getItem(KEYS.DATE) || '',
      routeLabel: localStorage.getItem(KEYS.LABEL) || '',
    };
  } catch {
    return {};
  }
}

export function savePickerState({ origin, dest, date, routeLabel }) {
  try {
    if (origin) localStorage.setItem(KEYS.ORIGIN, origin);
    if (dest) localStorage.setItem(KEYS.DEST, dest);
    if (date) localStorage.setItem(KEYS.DATE, date);
    if (routeLabel) localStorage.setItem(KEYS.LABEL, routeLabel);
  } catch {}
}
