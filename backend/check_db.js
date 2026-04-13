const { Pool } = require('pg');
const { initDB } = require('./db/index');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function checkDB() {
  try {
    console.log('--- Database Diagnostics ---');
    
    // 0. Ensure migrations have run
    await initDB();

    // 1. Column Check
    const pricesSchema = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'prices'
    `);
    console.log('Prices Columns:', pricesSchema.rows.map(r => r.column_name).sort().join(', '));

    // 2. Row Counts
    const counts = await pool.query(`
      SELECT 
        (SELECT COUNT(*) FROM prices) as raw_count,
        (SELECT COUNT(*) FROM summary_prices) as summary_count,
        (SELECT COUNT(*) FROM tracked_symbols) as cache_count
    `);
    console.log(`Raw ticks: ${counts.rows[0].raw_count}`);
    console.log(`Summaries: ${counts.rows[0].summary_count}`);
    console.log(`Cached symbols rows: ${counts.rows[0].cache_count}`);

    // 3. Latest Data
    const latest = await pool.query(`
      SELECT symbol, price, volume, timestamp 
      FROM prices 
      ORDER BY timestamp DESC 
      LIMIT 1
    `);
    if (latest.rows.length > 0) {
      const row = latest.rows[0];
      console.log(`Latest update: ${row.symbol} at ${row.timestamp}`);
      console.log(`Price: $${row.price}, Volume: ${row.volume}`);
    }

    process.exit(0);
  } catch (err) {
    console.error('DB Check failed:', err.message);
    process.exit(1);
  }
}

checkDB();
