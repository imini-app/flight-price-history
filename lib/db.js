import mysql from 'mysql2/promise';

const TABLE = 'fph_price_checks';

let pool;

function getPool() {
  if (pool) return pool;
  const url = new URL(process.env.DATABASE_URL);
  const sslRaw = url.searchParams.get('ssl');
  let ssl = {};
  if (sslRaw) {
    try { ssl = JSON.parse(sslRaw); } catch {}
  }
  pool = mysql.createPool({
    host: url.hostname,
    port: parseInt(url.port, 10),
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: url.pathname.slice(1),
    ssl: Object.keys(ssl).length ? ssl : undefined,
    waitForConnections: true,
    connectionLimit: 5,
    dateStrings: true,
  });
  return pool;
}

export async function initDb() {
  const conn = await getPool().getConnection();
  try {
    await conn.execute(`
      CREATE TABLE IF NOT EXISTS \`${TABLE}\` (
        id BIGINT AUTO_INCREMENT PRIMARY KEY,
        ip_address VARCHAR(45) NOT NULL,
        route_key VARCHAR(20) NOT NULL,
        route_label VARCHAR(120) NOT NULL,
        travel_date DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at DESC)
      )
    `);
    try {
      await conn.execute(`ALTER TABLE \`${TABLE}\` MODIFY travel_date DATE`);
    } catch {} // column already nullable
  } finally {
    conn.release();
  }
}

export async function saveCheck({ ip, routeKey, routeLabel, travelDate }) {
  const p = getPool();
  await p.execute(
    `INSERT INTO \`${TABLE}\` (ip_address, route_key, route_label, travel_date) VALUES (?, ?, ?, ?)`,
    [ip, routeKey, routeLabel, travelDate]
  );
}

export async function getRecentChecks(limit = 10) {
  const p = getPool();
  const n = parseInt(limit, 10) || 10;
  const [rows] = await p.query(
    `SELECT ip_address, route_key, route_label, travel_date, created_at FROM \`${TABLE}\` ORDER BY created_at DESC LIMIT ${n}`
  );
  return rows;
}
