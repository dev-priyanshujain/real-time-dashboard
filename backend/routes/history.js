const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /history?symbol=BTCUSDT
router.get('/', async (req, res) => {
  const { symbol, limit = 100 } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  const parsedLimit = Math.min(Math.max(parseInt(limit) || 100, 1), 500);

  try {
    const dbRes = await query(
      `(
        SELECT avg_price AS price, bucket_end AS timestamp
        FROM summary_prices
        WHERE symbol = $1
          AND bucket_start >= NOW() - INTERVAL '30 days'
        ORDER BY bucket_end DESC
        LIMIT $2
      )
      UNION ALL
      (
        SELECT price, timestamp
        FROM prices
        WHERE symbol = $1
        ORDER BY timestamp DESC
        LIMIT $2
      )
      ORDER BY timestamp DESC
      LIMIT $2`,
      [symbol.toUpperCase(), parsedLimit]
    );

    res.json(dbRes.rows.reverse());
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
