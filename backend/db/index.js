const { Pool } = require('pg');
require('dotenv').config();

const SUMMARY_AGE_HOURS = parseInt(process.env.SUMMARY_AGE_HOURS) || 1;
const SUMMARY_RETENTION_DAYS = parseInt(process.env.SUMMARY_RETENTION_DAYS) || 30;

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  const queries = [
    `CREATE TABLE IF NOT EXISTS prices (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(20) NOT NULL,
      price NUMERIC NOT NULL,
      volume NUMERIC,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `CREATE INDEX IF NOT EXISTS idx_prices_symbol_time ON prices(symbol, timestamp DESC)`,
    `CREATE TABLE IF NOT EXISTS summary_prices (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(20) NOT NULL,
      open_price NUMERIC NOT NULL,
      close_price NUMERIC NOT NULL,
      high_price NUMERIC NOT NULL,
      low_price NUMERIC NOT NULL,
      avg_price NUMERIC NOT NULL,
      total_volume NUMERIC,
      volatility NUMERIC,
      bucket_start TIMESTAMP WITH TIME ZONE NOT NULL,
      bucket_end TIMESTAMP WITH TIME ZONE NOT NULL,
      UNIQUE (symbol, bucket_start)
    )`,
    `CREATE INDEX IF NOT EXISTS idx_summary_symbol_bucket ON summary_prices(symbol, bucket_start DESC)`,
    `CREATE TABLE IF NOT EXISTS tracked_symbols (
      id SERIAL PRIMARY KEY,
      symbols TEXT[] NOT NULL,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    )`,
    `ALTER TABLE prices ADD COLUMN IF NOT EXISTS volume NUMERIC`,
    `ALTER TABLE summary_prices ADD COLUMN IF NOT EXISTS total_volume NUMERIC`,
    `ALTER TABLE summary_prices ADD COLUMN IF NOT EXISTS volatility NUMERIC`
  ];

  for (const q of queries) {
    try {
      await pool.query(q);
    } catch (err) {
      console.warn(`Migration step failed: ${q.substring(0, 30)}... - ${err.message}`);
    }
  }
  console.log('Database initialization check complete.');
}

async function downsampleAndCleanup() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const cutoff = `(CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '${SUMMARY_AGE_HOURS} hours'`;

    await client.query(`
      INSERT INTO summary_prices (symbol, open_price, close_price, high_price, low_price, avg_price, total_volume, volatility, bucket_start, bucket_end)
      SELECT
        symbol,
        (ARRAY_AGG(price ORDER BY timestamp ASC))[1] AS open_price,
        (ARRAY_AGG(price ORDER BY timestamp DESC))[1] AS close_price,
        MAX(price) AS high_price,
        MIN(price) AS low_price,
        AVG(price) AS avg_price,
        MAX(volume) AS total_volume,
        STDDEV(price) AS volatility,
        DATE_TRUNC('minute', MIN(timestamp) AT TIME ZONE 'UTC') AS bucket_start,
        DATE_TRUNC('minute', MAX(timestamp) AT TIME ZONE 'UTC') AS bucket_end
      FROM prices
      WHERE timestamp < ${cutoff}
      GROUP BY symbol, DATE_TRUNC('minute', timestamp AT TIME ZONE 'UTC')
      ON CONFLICT DO NOTHING
    `);

    const del = await client.query(`
      DELETE FROM prices WHERE timestamp < ${cutoff}
    `);

    const expired = await client.query(`
      DELETE FROM summary_prices WHERE bucket_start < (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '${SUMMARY_RETENTION_DAYS} days'
    `);

    await client.query('COMMIT');

    const downsampled = del.rowCount || 0;
    const expiredRows = expired.rowCount || 0;
    if (downsampled > 0 || expiredRows > 0) {
      console.log(`Downsampled ${downsampled} raw rows, expired ${expiredRows} old summaries.`);
    }
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error in downsample/cleanup:', error);
  } finally {
    client.release();
  }
}

function startCleanupJob() {
  const intervalMs = 1 * 60 * 60 * 1000;
  downsampleAndCleanup();
  setInterval(downsampleAndCleanup, intervalMs);
  console.log(`Downsample job running every 1 hour (raw→summary after ${SUMMARY_AGE_HOURS}h, summaries kept ${SUMMARY_RETENTION_DAYS}d).`);
}

module.exports = {
  pool,
  initDB,
  query: (text, params) => pool.query(text, params),
  startCleanupJob,
};
