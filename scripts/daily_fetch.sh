#!/usr/bin/env bash
set -euo pipefail

export PATH="$HOME/.opencode/bin:/tmp/node-v20.11.0-linux-x64/bin:$PATH"
PROJECT_DIR="/home/binxu/Projects/flight-price-history"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/fetch-$(date +%Y-%m-%d).log"

cd "$PROJECT_DIR"

echo "=== Daily price fetch started $(date) ===" >> "$LOG_FILE"

opencode run --dir "$PROJECT_DIR" \
  "Fetch daily flight prices for all routes in public/data/routes.json.

For each route (origin→dest), do:
1. Read the corresponding JSON file in public/data/
2. Get the lowest economy round-trip price using SerpApi Google Flights API
   - Departure: 60 days from today
   - Return: 14 days after departure
   - Currency: USD
   - Adults: 1
3. Append a new entry {\"date\": \"YYYY-MM-DD\", \"price\": <integer>, \"airline\": \"<Airline Name>\"} to the prices array
4. Save the file

Use this API key for SerpApi: \${SERPAPI_KEY:-''}
API endpoint: https://serpapi.com/search?engine=google_flights&departure_id={origin}&arrival_id={dest}&outbound_date={dep}&return_date={ret}&currency=USD&hl=en&api_key={key}

If SerpApi is not available, try scraping Skyscanner or Google Flights directly.
Skip routes that fail. Log everything to stdout." 2>&1 | tee -a "$LOG_FILE"

echo "=== Daily price fetch finished at $(date) ===" >> "$LOG_FILE"
