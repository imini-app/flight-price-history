#!/usr/bin/env bash
LOG="/home/binxu/Projects/flight-price-history/logs/snapshot-$(date +%Y-%m-%d).log"
TOTAL=162

while true; do
  finished=$(grep -c 'Finished in' "$LOG" 2>/dev/null || echo 0)
  current=$(grep -oP '\[\d+/\d+\] \K\S+' "$LOG" 2>/dev/null | tail -1)
  elapsed=$(ps -o etime= -C node 2>/dev/null | head -1 | xargs)
  last3=$(grep 'Finished in' "$LOG" 2>/dev/null | tail -3)

  clear 2>/dev/null || true
  echo "=== $(date) | PID $$ ==="
  echo "Routes finished: $finished / $TOTAL"
  echo "Currently on:    ${current:-N/A}"
  echo "Elapsed:         ${elapsed:-N/A}"
  echo ""
  echo "--- Last 3 finishes ---"
  echo "$last3" | tail -3
  echo ""
  echo "--- Process tree ---"
  pstree -p $(pgrep -f scrape_google_flights | head -1) 2>/dev/null || ps --forest -C node 2>/dev/null | head -10
  echo ""
  echo "(refreshes every 60s)"

  sleep 60
done
