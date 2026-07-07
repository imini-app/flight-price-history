#!/usr/bin/env node
/**
 * scrape_google_flights.mjs
 *
 * Scrapes Google Flights for nonstop (direct) economy one-way flights.
 * Supports parallel scraping for speed.
 *
 * Usage:
 *   node scripts/scrape_google_flights.mjs --days 365 --concurrency 4
 *   node scripts/scrape_google_flights.mjs --route YYZ-PEK --days 7
 *
 * Options:
 *   --route KEY        Scrape only this route (omit to scrape ALL routes)
 *   --days N           Number of consecutive departure dates to scrape (default: 1)
 *   --start-offset N   First departure is N days from today (default: 1 = tomorrow)
 *   --concurrency N    Number of parallel browser tabs (default: 4)
 *   --stops N          Max stops: 0 = nonstop only, 1 = 1 stop or fewer (default: 0)
 *   --parallel-routes N Process N routes in parallel (default: 1)
 *   --dry-run          Don't write files, just print results
 */

import fs from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer-core";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, "..", "public", "data");
const ROUTES_FILE = path.join(DATA_DIR, "routes.json");
const CHROME_PATH =
  process.env.CHROME_PATH ||
  path.join(
    process.env.HOME,
    ".cache/puppeteer/chrome/linux-150.0.7871.46/chrome-linux64/chrome"
  );

// --- CLI args ---
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const routeFilter =
  args.indexOf("--route") !== -1 ? args[args.indexOf("--route") + 1] : null;
const numDays =
  args.indexOf("--days") !== -1
    ? parseInt(args[args.indexOf("--days") + 1], 10)
    : 1;
const startOffset =
  args.indexOf("--start-offset") !== -1
    ? parseInt(args[args.indexOf("--start-offset") + 1], 10)
    : 1;
const concurrency =
  args.indexOf("--concurrency") !== -1
    ? parseInt(args[args.indexOf("--concurrency") + 1], 10)
    : 4;
const maxStops =
  args.indexOf("--stops") !== -1
    ? parseInt(args[args.indexOf("--stops") + 1], 10)
    : 0;
const parallelRoutes =
  args.indexOf("--parallel-routes") !== -1
    ? parseInt(args[args.indexOf("--parallel-routes") + 1], 10)
    : 1;

// --- Memory monitoring ---
const MEM_MIN_FREE = 1 * 1024 ** 3;       // 1 GB — reduce concurrency
const MEM_CRITICAL = 512 * 1024 ** 2;     // 512 MB — drastic reduction
const MEM_CHECK_EVERY = 10;               // check every N dates inside worker

function checkMemory(label) {
  const free = os.freemem();
  const total = os.totalmem();
  const used = total - free;
  const pct = ((used / total) * 100).toFixed(1);
  const freeGb = (free / 1024 ** 3).toFixed(1);
  const totalGb = (total / 1024 ** 3).toFixed(1);

  const level = free < MEM_CRITICAL ? "CRITICAL" : free < MEM_MIN_FREE ? "WARNING" : "OK";
  console.log(`[MEM ${level}] ${label}: ${freeGb}GB free / ${totalGb}GB total (${pct}% used)`);
  return { free, total, used, level };
}

async function launchBrowser() {
  return puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: "new",
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-gpu",
      "--window-size=1920,1080",
    ],
  });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function formatDate(d) {
  return d.toISOString().split("T")[0];
}

function addDays(d, n) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function buildGoogleFlightsUrl(origin, dest, depDate) {
  return (
    `https://www.google.com/travel/flights` +
    `?q=Flights+from+${origin}+to+${dest}` +
    `+on+${depDate}+one+way+nonstop` +
    `&curr=USD&hl=en&gl=US`
  );
}

function parseFlightsFromText(text) {
  const flights = [];
  const lines = text.split("\n").map((l) => l.trim()).filter(Boolean);

  const airlineNames = [
    // Chinese carriers
    "Air China", "China Southern", "China Eastern", "Hainan Airlines", "Hainan",
    "Shenzhen Airlines", "Xiamen Airlines", "Sichuan Airlines", "Shanghai Airlines",
    "Beijing Capital Airlines", "Spring Airlines", "Juneyao Airlines", "Juneyao",
    "Tibet Airlines", "China Express",
    // Hong Kong / Macau
    "Cathay Pacific", "HK Express", "Greater Bay Airlines", "Air Macau",
    // Taiwan
    "EVA Air", "China Airlines", "Starlux Airlines",
    // Japan
    "ANA", "All Nippon Airways", "Japan Airlines", "Peach", "Jetstar Japan",
    "Zipair Tokyo", "Skymark Airlines", "StarFlyer", "Air Do", "Solaseed Air",
    // Korea
    "Korean Air", "Asiana", "Jin Air", "Air Seoul", "T'way Air", "Jeju Air", "Air Busan",
    // Southeast Asia
    "Singapore Airlines", "Scoot", "THAI", "Batik Air", "Malaysia Airlines",
    "AirAsia", "Philippine Airlines", "Vietnam Airlines", "Garuda Indonesia",
    "Lion Air", "Myanmar Airways", "Cambodia Angkor Air", "Royal Brunei",
    // South Asia
    "Air India", "Vistara", "IndiGo", "SpiceJet", "Akasa Air",
    "SriLankan Airlines", "Nepal Airlines", "Bhutan Airlines",
    // Middle East
    "Emirates", "Qatar Airways", "Etihad", "Saudia", "flydubai",
    "Oman Air", "Gulf Air", "Air Arabia", "Middle East Airlines",
    "Royal Jordanian", "flynas",
    // Africa
    "Ethiopian Airlines", "Kenya Airways", "South African Airways",
    "Royal Air Maroc", "EgyptAir", "Air Mauritius", "RwandAir",
    // Europe
    "British Airways", "Virgin Atlantic", "Lufthansa", "KLM", "Air France",
    "Swiss", "Austrian", "Turkish Airlines", "Finnair", "Iberia", "Aer Lingus",
    "Alitalia", "ITA Airways", "SAS", "Norwegian", "TAP Air Portugal",
    "Brussels Airlines", "LOT Polish Airlines", "Ryanair", "Wizz Air", "easyJet",
    "Vueling", "Eurowings", "Air Serbia", "Air Baltic", "Icelandair",
    "Aegean Airlines", "Luxair", "Croatia Airlines",
    // North America
    "Air Canada", "WestJet", "United", "Delta", "American",
    "Southwest", "JetBlue", "Alaska Airlines", "Hawaiian Airlines",
    "Frontier Airlines", "Spirit Airlines", "Allegiant Air", "Sun Country Airlines",
    "Porter Airlines", "Flair Airlines", "Air Transat",
    // Latin America
    "LATAM", "Avianca", "Copa Airlines", "Aeromexico", "Azul", "GOL", "Caribbean Airlines",
    // Oceania
    "Qantas", "Virgin Australia", "Jetstar", "Air New Zealand", "Fiji Airways",
  ];

  const timeRegex = /^\d{1,2}:\d{2}\s*(AM|PM)$/i;
  const priceRegex = /^\$[\d,]+$/;
  const durationRegex = /^\d+\s*hr(\s*\d+\s*min)?$/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (timeRegex.test(line) && i + 5 < lines.length) {
      let airline = null;
      let duration = null;
      let price = null;
      let priceAvailable = true;

      for (let j = i + 1; j < Math.min(i + 12, lines.length); j++) {
        const l = lines[j];
        if (!airline) {
          for (const a of airlineNames) {
            if (l.includes(a)) {
              airline = l;
              break;
            }
          }
        }
        if (!duration && durationRegex.test(l)) duration = l;
        if (!price && priceRegex.test(l)) {
          price = parseInt(l.replace(/[$,]/g, ""), 10);
        }
        if (l === "Price unavailable") priceAvailable = false;
        if (j > i + 1 && timeRegex.test(l)) break;
      }

      if (duration) {
        flights.push({
          departureTime: line,
          airline: airline || "Unknown",
          duration,
          stops: 0,
          isNonstop: true,
          price: price && price >= 50 && price <= 50000 ? price : null,
          priceAvailable,
        });
      }
    }
  }
  return flights;
}

async function scrapeOneDate(page, origin, dest, depDate) {
  const url = buildGoogleFlightsUrl(origin, dest, depDate);

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      await sleep(2000 + Math.random() * 2000);

      const pageText = await page.evaluate(() => document.body.innerText);
      const allFlights = parseFlightsFromText(pageText);
      const withPrice = allFlights.filter((f) => f.price !== null).sort((a, b) => a.price - b.price);

      return {
        cheapest: withPrice.length > 0 ? withPrice[0] : null,
        nonstopCount: allFlights.length,
        totalCount: allFlights.length,
        eligibleCount: allFlights.length,
      };
    } catch (err) {
      const msg = err?.message || "";
      if ((msg.includes("detached") || msg.includes("Detached")) && attempt < 2) {
        await sleep(3000);
        continue;
      }
      throw err;
    }
  }
}

/**
 * Scrape a batch of dates using a pool of browser pages.
 */
async function scrapeParallel(browser, dates, origin, dest, onDateComplete) {
  // Check system memory and reduce concurrency if needed
  const mem = checkMemory(`Before ${origin}-${dest} (${dates.length} dates)`);
  let effectiveConcurrency = concurrency;
  if (mem.free < MEM_CRITICAL) {
    effectiveConcurrency = Math.max(1, Math.floor(concurrency / 3));
    console.warn(`  Memory critical — reducing concurrency ${concurrency}→${effectiveConcurrency}`);
  } else if (mem.free < MEM_MIN_FREE) {
    effectiveConcurrency = Math.max(1, Math.floor(concurrency / 2));
    console.warn(`  Memory low — reducing concurrency ${concurrency}→${effectiveConcurrency}`);
  }

  const results = new Array(dates.length);
  let nextIdx = 0;

  // Create a pool of pages
  const pages = [];
  for (let i = 0; i < effectiveConcurrency; i++) {
    const p = await browser.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    await p.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    );
    pages.push(p);
  }

  async function createPage() {
    const p = await browser.newPage();
    await p.setViewport({ width: 1920, height: 1080 });
    await p.setUserAgent(
      "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Safari/537.36"
    );
    return p;
  }

  async function worker(workerPage, workerIdx) {
    while (nextIdx < dates.length) {
      const idx = nextIdx++;
      const { depStr } = dates[idx];

      if (idx % MEM_CHECK_EVERY === 0) {
        const mem = checkMemory(`Worker ${workerIdx}, date ${idx + 1}/${dates.length}`);
        if (mem.free < MEM_CRITICAL) {
          console.warn(`  Memory critical — pausing 30s`);
          await sleep(30000);
        } else if (mem.free < MEM_MIN_FREE) {
          await sleep(10000);
        }
      }

      let retries = 0;
      while (retries < 3) {
        try {
          const result = await scrapeOneDate(workerPage, origin, dest, depStr);
          results[idx] = { depStr, ...result };
          break;
        } catch (err) {
          const msg = err?.message || "";
          if ((msg.includes("detached") || msg.includes("Detached")) && retries < 2) {
            retries++;
            await workerPage.close().catch(() => {});
            workerPage = await createPage();
            pages[workerIdx] = workerPage;
            continue;
          }
          if (msg.includes("Connection closed") || msg.includes("Target closed")) {
            throw err;
          }
          results[idx] = { depStr, error: msg, cheapest: null };
          break;
        }
      }

      if (onDateComplete) {
        onDateComplete(results[idx]);
      }

      await sleep(2000 + Math.random() * 3000);
    }
  }

  try {
    await Promise.all(pages.map((p, i) => worker(p, i)));
  } finally {
    for (const p of pages) {
      await p.close().catch(() => {});
    }
  }

  checkMemory(`After ${origin}-${dest}`);
  return results;
}

async function main() {
  if (!fs.existsSync(CHROME_PATH)) {
    console.error(`Chrome not found at ${CHROME_PATH}`);
    process.exit(1);
  }

  const routes = JSON.parse(fs.readFileSync(ROUTES_FILE, "utf-8"));
  const filteredRoutes = routeFilter
    ? routes.filter((r) => r.key === routeFilter)
    : routes;

  if (filteredRoutes.length === 0) {
    console.error(`No routes found matching: ${routeFilter}`);
    process.exit(1);
  }

  const today = new Date();
  const stopLabel = maxStops === 0 ? "Nonstop only" : `${maxStops} stop(s) or fewer`;

  console.log(`=== Google Flights Scraper (Parallel) ===`);
  console.log(`Routes: ${filteredRoutes.length} route(s) to scrape`);
  if (routeFilter) console.log(`  (filtered to: ${routeFilter})`);
  console.log(`Filter: ${stopLabel}`);
  console.log(`Concurrency: ${concurrency} parallel tabs per route`);
  if (parallelRoutes > 1) console.log(`Parallel routes: ${parallelRoutes} (${concurrency * parallelRoutes} total tabs)`);
  console.log(`Days per route: ${numDays}, starting ${startOffset} day(s) from today`);
  console.log(
    `Departure range: ${formatDate(addDays(today, startOffset))} → ${formatDate(addDays(today, startOffset + numDays - 1))}`
  );
  if (dryRun) console.log("MODE: DRY RUN\n");
  else console.log("");

  // Build date list
  const dates = [];
  for (let d = 0; d < numDays; d++) {
    const depDate = addDays(today, startOffset + d);
    dates.push({ depStr: formatDate(depDate) });
  }

  const snapDate = formatDate(today);

  function loadExistingDates(routeKey) {
    const dataFile = path.join(DATA_DIR, `${routeKey}.json`);
    try {
      const data = JSON.parse(fs.readFileSync(dataFile, "utf-8"));
      const existing = new Set();
      for (const p of (data.prices || [])) {
        if (p.snapshot === snapDate) existing.add(p.date);
      }
      return existing;
    } catch {
      return new Set();
    }
  }

  function saveRouteData(route, routeResults) {
    const dataFile = path.join(DATA_DIR, `${route.key}.json`);
    let data;
    try { data = JSON.parse(fs.readFileSync(dataFile, "utf-8")); }
    catch {
      data = { route: route.key, origin: route.origin, dest: route.dest, label: route.label, prices: [] };
    }
    const seen = new Set(data.prices.map(p => `${p.date}|${p.snapshot}`));
    for (const r of routeResults) {
      if (!r.price) continue;
      const key = `${r.departDate}|${snapDate}`;
      if (seen.has(key)) continue;
      seen.add(key);
      data.prices.push({
        date: r.departDate,
        snapshot: snapDate,
        price: r.price,
        airline: r.airline,
        nonstop: r.isNonstop,
        stops: r.stops,
        duration: r.duration,
      });
    }
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
    console.log(`  Saved ${dataFile}`);
  }

  // Process routes — each route (or batch) gets its own browser to avoid CDP drift
  async function scrapeOneRoute(ri, route) {
    const routeStart = Date.now();
    console.log(`\n[${ri + 1}/${filteredRoutes.length}] ${route.key}: ${route.originCity} → ${route.destCity}`);

    // Skip dates already scraped today
    const existingDates = loadExistingDates(route.key);
    const pendingDates = dates.filter((d) => !existingDates.has(d.depStr));
    if (pendingDates.length === 0) {
      console.log(`  All ${dates.length} dates already scraped for today, skipping.`);
      return { route, results: [] };
    }
    if (pendingDates.length < dates.length) {
      console.log(`  ${dates.length - pendingDates.length}/${dates.length} dates already scraped, scraping remaining ${pendingDates.length}`);
    }

    let browser;
    let results;
    const routeResults = [];
    let saveCounter = 0;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        browser = await launchBrowser();
        results = await scrapeParallel(browser, pendingDates, route.origin, route.dest, onDateComplete);
        break;
      } catch (err) {
        console.warn(`  Browser error (attempt ${attempt + 1}/2): ${err.message}`);
        await browser?.close().catch(() => {});
        browser = null;
        if (attempt === 1) throw err;
        console.warn(`  Retrying ${route.key} after 10s delay...`);
        await sleep(10000);
      }
    }

    function onDateComplete(result) {
      if (result.cheapest) {
        const f = result.cheapest;
        console.log(
          `  ${result.depStr} ... $${f.price} (${f.airline}, nonstop, ${f.duration})`
        );
        routeResults.push({
          date: snapDate,
          departDate: result.depStr,
          price: f.price,
          airline: f.airline,
          isNonstop: f.isNonstop,
          stops: f.stops,
          duration: f.duration,
        });
      } else {
        const note = result.error || (result.eligibleCount > 0 ? "prices unavailable" : (result.nonstopCount > 0 ? "nonstop exists, no price" : "no nonstop flights"));
        console.log(`  ${result.depStr} ... - (${note})`);
        routeResults.push({ date: snapDate, departDate: result.depStr, price: null, airline: null, note });
      }

      saveCounter++;
      if (saveCounter % 5 === 0 && !dryRun) {
        saveRouteData(route, routeResults);
      }
    }

    const elapsed = ((Date.now() - routeStart) / 1000).toFixed(0);
    const withPrice = routeResults.filter((r) => r.price);
    console.log(`  Finished in ${elapsed}s — ${withPrice.length}/${routeResults.length} days with prices`);

    // Save remaining results that weren't saved by incremental batches
    if (!dryRun && saveCounter % 5 !== 0) {
      saveRouteData(route, routeResults);
    }

    await browser?.close().catch(() => {});

    return { route, results: routeResults };
  }

  // Process routes in parallel — each route gets its own browser
  async function processRoutePool(routes, concurrency) {
    const results = new Array(routes.length);
    let idx = 0;

    async function worker() {
      while (idx < routes.length) {
        const i = idx++;
        results[i] = await scrapeOneRoute(i, routes[i]);
      }
    }

    const poolSize = Math.min(concurrency, routes.length);
    const workers = Array.from({ length: poolSize }, () => worker());
    await Promise.all(workers);
    return results;
  }

  const effectiveParallel = parallelRoutes > 0 ? parallelRoutes : 1;
  const allRouteResults = await processRoutePool(filteredRoutes, effectiveParallel);

  if (!dryRun) {
    console.log(`\nAll routes processed.`);
  }

  // Print per-route summaries
  for (const { route, results } of allRouteResults) {
    const withPrice = results.filter((r) => r.price);
    console.log(`\n${"=".repeat(90)}`);
    console.log(`${route.key}: ${route.originCity} → ${route.destCity}`);
    console.log(`${"=".repeat(90)}`);
    console.log(`Dep Date    | Price   | Airline              | Stops | Duration   | Status`);
    console.log(`------------|---------|----------------------|-------|------------|----------`);
    for (const r of results) {
      const price = r.price ? `$${r.price}`.padStart(7) : "    -  ";
      const airline = (r.airline || "-").substring(0, 20).padEnd(20);
      const stops = r.stops !== undefined ? (r.isNonstop ? "  0   " : `  ${r.stops}   `) : "  -   ";
      const duration = (r.duration || "-").padEnd(10);
      const status = r.price ? "OK" : r.note || "N/A";
      console.log(`${r.date} | ${price} | ${airline} | ${stops} | ${duration} | ${status}`);
    }
    if (withPrice.length > 0) {
      const prices = withPrice.map((r) => r.price);
      console.log(`  Min: $${Math.min(...prices)}  Max: $${Math.max(...prices)}  Avg: $${Math.round(prices.reduce((a, b) => a + b, 0) / prices.length)}`);
    }
  }

  // Grand summary
  const totalDays = allRouteResults.reduce((s, r) => s + r.results.length, 0);
  const totalWithPrice = allRouteResults.reduce((s, r) => s + r.results.filter((x) => x.price).length, 0);
  console.log(`\n${"=".repeat(90)}`);
  console.log(`GRAND SUMMARY: ${allRouteResults.length} routes, ${totalWithPrice}/${totalDays} days with nonstop prices`);
  console.log(`${"=".repeat(90)}`);
  console.log(`Done.`);
}

process.on("uncaughtException", (err) => {
  console.error("\n=== UNCAUGHT EXCEPTION ===");
  console.error(err);
  process.exit(1);
});
process.on("unhandledRejection", (reason) => {
  console.error("\n=== UNHANDLED REJECTION ===");
  console.error(reason);
  process.exit(1);
});

main().catch((err) => { console.error("Fatal error:", err); process.exit(1); });
