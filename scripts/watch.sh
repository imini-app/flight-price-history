#!/usr/bin/env bash
LOG="/home/binxu/Projects/flight-price-history/logs/snapshot-$(date +%Y-%m-%d).log"
TOTAL=162
PID_FILE="/tmp/fph-scraper-pid"

pgrep -f "scrape_google_flights.mjs" > "$PID_FILE"

while true; do
  pid=$(pgrep -f "scrape_google_flights.mjs" 2>/dev/null | head -1)
  now=$(date '+%H:%M:%S')

  if [ -z "$pid" ]; then
    echo "[$now] CRASH: scraper process not found!"
    exit 1
  fi

  finished=$(grep -c 'Finished in' "$LOG" 2>/dev/null || echo 0)
  current=$(grep -oP '\[\d+/162\] \K\S+' "$LOG" 2>/dev/null | sort -t/ -k1 -n | tail -1)
  elapsed=$(ps -o etime= -p "$pid" 2>/dev/null | tail -1 | xargs)

  echo "[$now] $finished/$total | $current | up $elapsed"

  sleep 60
done
