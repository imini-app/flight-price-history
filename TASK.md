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

Use one of the following APIs / services (pick one that fits your budget and access):

| Source | Type | Notes |
|---|---|---|
| [Google Flights API](https://developers.google.com/flights) | Official | Requires API key, rate-limited |
| [Amadeus Self-Service API](https://developers.amadeus.com/self-service) | Official | Free tier available (2,000 req/day) |
| [AviationStack](https://aviationstack.com/) | Official | Free tier (100 req/month) |
| [Skyscanner API](https://developers.skyscanner.net/) | Official | Requires API key |
| [SerpAPI Google Flights](https://serpapi.com/google-flights-api) | Third-party | Paid, easy to use |
| [Web scrape Google Flights](https://github.com/nicedoc/selenium-google-flights-scraper) | Scraping | Free but fragile |

### Recommended approach (Amadeus)

```bash
# 1. Get access token
curl -X POST "https://test.api.amadeus.com/v1/security/oauth2/token" \
  -d "grant_type=client_credentials" \
  -d "client_id=YOUR_API_KEY" \
  -d "client_secret=YOUR_API_SECRET"

# 2. Search flight offers
curl "https://test.api.amadeus.com/v2/shopping/flight-offers" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "originLocationCode": "YYZ",
    "destinationLocationCode": "PVG",
    "departureDate": "2025-09-01",
    "returnDate": "2025-09-15",
    "adults": 1,
    "currencyCode": "USD",
    "max": 5
  }'
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
