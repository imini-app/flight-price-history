#!/usr/bin/env bash
# Wrapper to capture exit code reliably
NODE_OPTIONS="--max-old-space-size=4096"
export NODE_OPTIONS
cd /home/binxu/Projects/flight-price-history
node scripts/scrape_google_flights.mjs \
  --days 270 --start-offset 1 --concurrency 5 \
  --trip-length 14 --stops 0 > /tmp/snapshot_run.log 2>&1
EXIT_CODE=$?
echo "" >> /tmp/snapshot_run.log
echo "=== EXIT CODE: $EXIT_CODE ===" >> /tmp/snapshot_run.log
exit $EXIT_CODE
