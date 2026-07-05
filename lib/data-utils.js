export async function fetchRoutes() {
  const res = await fetch('/data/routes.json');
  if (!res.ok) throw new Error('Failed to load routes');
  return res.json();
}

export async function fetchRouteData(routeKey) {
  const res = await fetch(`/data/${routeKey}.json`);
  if (!res.ok) throw new Error('Failed to load route data');
  return res.json();
}

export function buildOriginIndex(routes) {
  const map = {};
  for (const r of routes) {
    if (!map[r.origin]) map[r.origin] = { code: r.origin, city: r.originCity, country: r.originCountry, destinations: [] };
    map[r.origin].destinations.push({ code: r.dest, city: r.destCity, country: r.destCountry, key: r.key });
  }
  return Object.values(map).sort((a, b) => a.city.localeCompare(b.city));
}

export function filterRoutesByOrigin(routes, originCode) {
  return routes.filter(r => r.origin === originCode);
}

export function getRouteKey(routes, originCode, destCode) {
  const r = routes.find(r => r.origin === originCode && r.dest === destCode);
  return r ? r.key : null;
}

export function filterPricesByDateRange(prices, endDate, monthsBack = 12) {
  const end = new Date(endDate);
  const start = new Date(end);
  start.setMonth(start.getMonth() - monthsBack);
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  return prices.filter(p => {
    const d = new Date(p.date);
    return d >= start && d <= end;
  });
}

export function computeStats(prices) {
  if (!prices || prices.length === 0) return null;
  const vals = prices.map(p => p.price).sort((a, b) => a - b);
  const n = vals.length;
  const sum = vals.reduce((a, b) => a + b, 0);
  const avg = sum / n;
  const median = n % 2 === 0 ? (vals[n/2 - 1] + vals[n/2]) / 2 : vals[Math.floor(n/2)];

  const airlineCosts = {};
  for (const p of prices) {
    if (!airlineCosts[p.airline]) airlineCosts[p.airline] = [];
    airlineCosts[p.airline].push(p.price);
  }
  const airlineAvgs = Object.entries(airlineCosts).map(([name, costs]) => ({
    name, avg: costs.reduce((a, b) => a + b, 0) / costs.length, min: Math.min(...costs), max: Math.max(...costs)
  })).sort((a, b) => a.avg - b.avg);

  const bestMonth = findBestMonth(prices);

  return {
    min: vals[0], max: vals[n - 1], avg: Math.round(avg * 10) / 10, median,
    range: vals[n - 1] - vals[0],
    airlines: airlineAvgs,
    bestMonth
  };
}

function findBestMonth(prices) {
  const months = {};
  for (const p of prices) {
    const m = p.date.substring(0, 7);
    if (!months[m]) months[m] = [];
    months[m].push(p.price);
  }
  let best = null, bestAvg = Infinity;
  for (const [m, vals] of Object.entries(months)) {
    const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
    if (avg < bestAvg) { bestAvg = avg; best = m; }
  }
  return best ? { month: best, avg: Math.round(bestAvg) } : null;
}
