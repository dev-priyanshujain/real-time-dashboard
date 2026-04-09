const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function initDB() {
  const query = `
    CREATE TABLE IF NOT EXISTS prices (
      id SERIAL PRIMARY KEY,
      symbol VARCHAR(20) NOT NULL,
      price NUMERIC NOT NULL,
      timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_prices_symbol_time ON prices(symbol, timestamp DESC);
  `;
  try {
    await pool.query(query);
    console.log('Database initialized: prices table check complete.');
  } catch (error) {
    console.error('Error initializing database:', error);
  }
}

module.exports = {
  pool,
  initDB,
  query: (text, params) => pool.query(text, params),
};
