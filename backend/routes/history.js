const express = require('express');
const router = express.Router();
const { query } = require('../db');

const VALID_RANGES = {
  '1h':  { interval: '1 hour',    limit: 1200 },
  '6h':  { interval: '6 hours',   limit: 5000 },
  '1d':  { interval: '1 day',     limit: 10000 },
  '7d':  { interval: '7 days',    limit: 20000 },
  '30d': { interval: '30 days',   limit: 50000 },
};

// GET /history?symbol=BTCUSDT&range=1d
router.get('/', async (req, res) => {
  const { symbol, range = '1d' } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const cfg = VALID_RANGES[range] || VALID_RANGES['1d'];

  try {
    let sql;
    if (range === '1h') {
      // High-resolution view for 1 hour
      sql = `
        SELECT price, volume, timestamp FROM (
          SELECT price, volume, timestamp 
          FROM prices 
          WHERE symbol = $1 
            AND timestamp >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '1 hour'
          ORDER BY timestamp DESC
          LIMIT $2
        ) AS latest
        ORDER BY timestamp ASC
      `;
    } else {
      // Consistent 1-minute resolution for longer ranges
      sql = `
        SELECT price, volume, timestamp FROM (
          SELECT avg_price AS price, total_volume AS volume, bucket_end AS timestamp
          FROM summary_prices
          WHERE symbol = $1
            AND bucket_start >= (CURRENT_TIMESTAMP AT TIME ZONE 'UTC') - INTERVAL '${cfg.interval}'
          ORDER BY bucket_end DESC
          LIMIT $2
        ) AS latest
        ORDER BY timestamp ASC
      `;
    }

    const dbRes = await query(sql, [symbol.toUpperCase(), cfg.limit]);

    res.json(dbRes.rows);
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
