const express = require('express');
const router = express.Router();
const { query } = require('../db');

// GET /history?symbol=BTCUSDT
router.get('/', async (req, res) => {
  const { symbol, limit = 100 } = req.query;

  if (!symbol) {
    return res.status(400).json({ error: 'Symbol parameter is required' });
  }

  try {
    const dbRes = await query(
      `SELECT price, timestamp 
       FROM prices 
       WHERE symbol = $1 
       ORDER BY timestamp DESC 
       LIMIT $2`,
      [symbol.toUpperCase(), parseInt(limit)]
    );
    
    // Return ascending for chart compatibility (oldest to newest series)
    res.json(dbRes.rows.reverse());
  } catch (err) {
    console.error('Error fetching history:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
