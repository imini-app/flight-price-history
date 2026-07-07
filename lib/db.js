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
        check_type VARCHAR(20) NOT NULL DEFAULT 'price_check',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_created_at (created_at DESC)
      )
    `);
    try {
      await conn.execute(`ALTER TABLE \`${TABLE}\` MODIFY travel_date DATE`);
    } catch {}
    try {
      await conn.execute(`ALTER TABLE \`${TABLE}\` ADD COLUMN check_type VARCHAR(20) NOT NULL DEFAULT 'price_check'`);
    } catch {}
    // backfill check_type for existing rows
    try {
      await conn.execute(`UPDATE \`${TABLE}\` SET check_type = 'route_history' WHERE travel_date IS NULL AND check_type = 'price_check'`);
    } catch {}
  } finally {
    conn.release();
  }
}

export async function saveCheck({ ip, routeKey, routeLabel, travelDate, checkType }) {
  const p = getPool();
  await p.execute(
    `INSERT INTO \`${TABLE}\` (ip_address, route_key, route_label, travel_date, check_type) VALUES (?, ?, ?, ?, ?)`,
    [ip, routeKey, routeLabel, travelDate, checkType || 'price_check']
  );
}

const VALID_CHECK_TYPES = ['price_check', 'route_history'];

export async function getRecentChecks({ limit = 10, type } = {}) {
  const p = getPool();
  const n = parseInt(limit, 10) || 10;
  let sql, params;
  if (type && VALID_CHECK_TYPES.includes(type)) {
    const partitionBy = type === 'route_history' ? 'route_key' : 'route_key, travel_date';
    sql = `SELECT ip_address, route_key, route_label, travel_date, check_type, created_at
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY ${partitionBy} ORDER BY created_at DESC) AS rn
        FROM \`${TABLE}\` WHERE check_type = ?
      ) t WHERE t.rn = 1 ORDER BY created_at DESC LIMIT ${n}`;
    params = [type];
  } else {
    sql = `SELECT ip_address, route_key, route_label, travel_date, check_type, created_at
      FROM (
        SELECT *, ROW_NUMBER() OVER (PARTITION BY route_key ORDER BY created_at DESC) AS rn
        FROM \`${TABLE}\`
      ) t WHERE t.rn = 1 ORDER BY created_at DESC LIMIT ${n}`;
    params = [];
  }
  const [rows] = await p.query(sql, params);
  return rows;
}
