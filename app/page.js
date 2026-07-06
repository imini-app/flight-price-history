'use client';

import Link from 'next/link';

export default function Home() {
  return (
    <main className="container">
      <div className="hero">
        <h1>Flight Price History</h1>
        <p className="hero-sub">Track and explore historical flight prices from daily snapshots of major international routes.</p>
        <div className="hero-actions">
          <Link href="/trend" className="btn btn-primary btn-lg">Check Price Trend</Link>
          <Link href="/explore" className="btn btn-secondary btn-lg">Explore Routes</Link>
        </div>
      </div>

      <div className="landing-cards">
        <div className="card">
          <h3>📈 Price Trend</h3>
          <p>Pick a route and a specific departure date to see how the price has changed across daily snapshots. Helps you decide whether to buy now or wait.</p>
          <Link href="/trend" className="btn btn-primary">Go to Price Trend</Link>
        </div>
        <div className="card">
          <h3>🗺 Explore Routes</h3>
          <p>Browse average prices across departure dates to find the best time to fly. Each price point is the average of all daily snapshots for that date.</p>
          <Link href="/explore" className="btn btn-primary">Explore Routes</Link>
        </div>
      </div>

      <div className="card guide">
        <h3>How it works</h3>
        <p>A cron job runs daily and records the lowest available price for each route. Over time, this builds a history that reveals pricing trends.</p>
        <div className="examples">
          <div className="example">
            <span className="example-icon">📈</span>
            <div>
              <strong>London → New York, Dec 20</strong>
              <p>If the price was $580 in July but rose to $720 in August, the trend suggests buying earlier was better.</p>
            </div>
          </div>
          <div className="example">
            <span className="example-icon">📉</span>
            <div>
              <strong>Hong Kong → Tokyo, Sep 1</strong>
              <p>If the price dropped from $305 to $252 over several weeks, waiting may have saved you money.</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}