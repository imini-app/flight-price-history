# Daily Price Snapshot Task

## Objective
Fetch daily flight price snapshots for all tracked routes and update the JSON data files.

## Frequency
Run **once per day** — prices typically update in the early morning (e.g., 06:00 UTC).

## Prompt / Instructions

Fetch the lowest available economy round-trip price for each route below, for a departure
**60 days from today** and a return **14 days after departure**. Store the result in the
corresponding `public/data/{ORIGIN}-{DEST}.json` file by appending a new entry to the `prices` array.

### Data format

Each price entry must follow this structure:

```json
{
  "date": "YYYY-MM-DD",
  "price": <integer>,
  "airline": "<Airline Name>"
}
```

### Sources

| Source | Type | Price | Notes |
|---|---|---|---|
| [SerpApi Google Flights API](https://serpapi.com/google-flights-api) | Third-party API | Paid from $50/mo | 100 free searches on signup, no CC required for trial. Returns structured JSON. **Recommended.** |
| [Scrapeless Google Flights API](https://www.scrapeless.com/en/blog/google-flights-api) | Third-party API | ~$1/1K URLs | Pay-as-you-go, no monthly minimum |
| [AviationStack](https://aviationstack.com/) | Official API | Free: 100 req/mo · Paid from $50/mo | Flight schedules & pricing data |
| [Skyscanner API](https://developers.skyscanner.net/) | Official API | Needs partnership | Requires application/approval |
| [Apify Skyscanner Actor](https://apify.com/scraped/flight-price-trends) | Scraping platform | $15/mo + usage | Pre-built Skyscanner scraper, easy setup |
| [Google Flights scraping](https://github.com/nicedoc/selenium-google-flights-scraper) | DIY scraping | Free | Fragile, requires maintenance |

### Recommended approach (SerpApi Google Flights)

```bash
curl -s "https://serpapi.com/search?engine=google_flights&departure_id=YYZ&arrival_id=PVG&outbound_date=2025-09-01&return_date=2025-09-15&currency=USD&hl=en&api_key=YOUR_API_KEY"
```

Response includes `best_flights` and `other_flights` arrays with price, airline, duration, stops, etc.

### Alternative free approach (Skyscanner scraping with Python)

```python
from playwright.sync_api import sync_playwright

def scrape_skyscanner(origin, dest, dep_date, ret_date):
    url = f"https://www.skyscanner.ca/transport/flights/{origin}/{dest}/{dep_date}/{ret_date}/"
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        page.goto(url, timeout=30000)
        page.wait_for_selector('[data-testid="ticket-price"]', timeout=15000)
        prices = page.locator('[data-testid="ticket-price"]').all_inner_texts()
        browser.close()
        return prices
```

### Automation script template

```python
#!/usr/bin/env python3
"""fetch_prices.py — Daily price snapshot updater."""
import json, os, requests
from datetime import datetime, timedelta

DATA_DIR = "public/data"
DEPARTURE_IN = 60
TRIP_LENGTH = 14

def fetch_price(origin, dest, dep_date, ret_date):
    """Call your chosen API and return the lowest price + airline."""
    # TODO: implement
    pass

def update():
    routes_file = os.path.join(DATA_DIR, "routes.json")
    with open(routes_file) as f:
        routes = json.load(f)

    dep = (datetime.today() + timedelta(days=DEPARTURE_IN)).strftime("%Y-%m-%d")
    ret = (datetime.today() + timedelta(days=DEPARTURE_IN + TRIP_LENGTH)).strftime("%Y-%m-%d")
    today = datetime.today().strftime("%Y-%m-%d")

    for route in routes:
        key = route["key"]
        price, airline = fetch_price(route["origin"], route["dest"], dep, ret)
        if price is None:
            continue

        data_file = os.path.join(DATA_DIR, f"{key}.json")
        with open(data_file) as f:
            data = json.load(f)

        data["prices"].append({"date": today, "price": price, "airline": airline})

        with open(data_file, "w") as f:
            json.dump(data, f, indent=2)

        print(f"  {key}: ${price} ({airline})")

if __name__ == "__main__":
    update()
```

### GitHub Actions (optional)

Create `.github/workflows/fetch-prices.yml` to run automatically every day:

```yaml
name: Fetch Daily Prices
on:
  schedule:
    - cron: "0 6 * * *"
  workflow_dispatch:
jobs:
  fetch:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: "3.x"
      - run: pip install requests
      - run: python scripts/fetch_prices.py
        env:
          AMADEUS_API_KEY: ${{ secrets.AMADEUS_API_KEY }}
          AMADEUS_API_SECRET: ${{ secrets.AMADEUS_API_SECRET }}
      - run: |
          git config user.name "price-bot"
          git config user.email "bot@example.com"
          git add public/data/
          git diff --cached --quiet || git commit -m "Daily price snapshot $(date +%Y-%m-%d)"
          git push
```

## Routes tracked

See `public/data/routes.json` for the full list of origin-destination pairs. Currently
tracks **54 major international routes** across North America, Europe, Asia, Australia,
and the Middle East.
