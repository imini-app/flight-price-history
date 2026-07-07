#!/usr/bin/env bash
set -u
# NOTE: deliberate omission of 'set -e' so that scraper exit code is captured below

PROJECT_DIR="/home/binxu/Projects/flight-price-history"
LOG_DIR="$PROJECT_DIR/logs"
mkdir -p "$LOG_DIR"

LOG_FILE="$LOG_DIR/snapshot-$(date +%Y-%m-%d).log"
SCRAPER="$PROJECT_DIR/scripts/scrape_google_flights.mjs"

# Find node
NODE=$(command -v node || echo "")
if [ -z "$NODE" ]; then
  for p in /usr/local/bin/node /usr/bin/node "$HOME/.nvm/versions/node/"*/bin/node; do
    if [ -x "$p" ]; then NODE="$p"; break; fi
  done
fi
if [ -z "$NODE" ]; then
  echo "ERROR: node not found" | tee -a "$LOG_FILE"
  exit 1
fi

# Find Chrome — check common paths and CHROME_PATH env
CHROME="${CHROME_PATH:-}"
if [ -z "$CHROME" ] || [ ! -x "$CHROME" ]; then
  for p in \
    "$HOME/.cache/puppeteer/chrome/"*/chrome-linux64/chrome \
    /usr/bin/google-chrome \
    /usr/bin/google-chrome-stable \
    /usr/bin/chromium-browser \
    /usr/bin/chromium; do
    if [ -x "$p" ]; then CHROME="$p"; break; fi
  done
fi
if [ -z "$CHROME" ] || [ ! -x "$CHROME" ]; then
  echo "ERROR: Chrome not found. Set CHROME_PATH env var." | tee -a "$LOG_FILE"
  exit 1
fi

echo "=== Daily snapshot started $(date) ===" | tee -a "$LOG_FILE"
echo "Chrome: $CHROME" | tee -a "$LOG_FILE"
echo "Node: $NODE" | tee -a "$LOG_FILE"

# Allow Node to use more heap — Chrome tabs are the main pressure
export NODE_OPTIONS="--max-old-space-size=4096"

# Scrape all routes, 180 days into the future (6 months), 2 routes in parallel
"$NODE" "$SCRAPER" \
  --days 180 \
  --start-offset 1 \
  --concurrency 3 \
  --parallel-routes 2 \
  --stops 0 \
  2>&1 | tee -a "$LOG_FILE"

EXIT_CODE=${PIPESTATUS[0]}

echo "" | tee -a "$LOG_FILE"
echo "=== Daily snapshot finished $(date) (exit: $EXIT_CODE) ===" | tee -a "$LOG_FILE"

exit $EXIT_CODE
