const WebSocket = require('ws');
const { query } = require('../db');
const EventEmitter = require('events');

const priceEvents = new EventEmitter();

let latestPrices = {};
let chunkUpdates = {}; // Only broadcast what changed
let lastEmit = 0;
let top100Symbols = new Set();
let binanceWs;

// The all market mini tickers stream is much more efficient for tracking 100+ coins
const BINANCE_WS_URL = 'wss://stream.binance.com:9443/ws/!miniTicker@arr';

async function fetchTop100Symbols() {
  try {
    let marketCapSymbols = [];
    try {
      // 1. Get top coins by Market Cap from CoinGecko
      const cgRes = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=200&page=1&sparkline=false');
      if (!cgRes.ok) throw new Error('CoinGecko API unavailable/rate-limited');
      const cgData = await cgRes.json();
      
      marketCapSymbols = cgData
        .map(c => c.symbol.toUpperCase() + 'USDT')
        .filter(s => !['USDTUSDT', 'USDCUSDT', 'FDUSDUSDT', 'TUSDUSDT', 'DAIUSDT'].includes(s));
    } catch (cgErr) {
      console.warn('CoinGecko fetch failed, falling back to Binance 24h volume:', cgErr.message);
      // Fallback to Binance volume if CoinGecko fails
      const res = await fetch('https://api.binance.com/api/v3/ticker/24hr');
      const data = await res.json();
      
      if (Array.isArray(data)) {
        marketCapSymbols = data
          .filter(t => t.symbol.endsWith('USDT'))
          .sort((a, b) => parseFloat(b.quoteVolume) - parseFloat(a.quoteVolume))
          .map(t => t.symbol);
      } else {
        throw new Error('Binance 24h ticker response was not an array');
      }
    }

    // 2. Fetch valid Binance pairs to ensure the coin has an active USDT pair
    const binanceRes = await fetch('https://api.binance.com/api/v3/exchangeInfo');
    const binanceData = await binanceRes.json();
    
    if (!binanceData.symbols) {
      throw new Error('Binance exchangeInfo response missing symbols');
    }

    const validBinancePairs = new Set(
      binanceData.symbols.filter(s => s.status === 'TRADING').map(s => s.symbol)
    );

    // 3. Intersect and enforce exactly top 100
    const symbols = marketCapSymbols.filter(s => validBinancePairs.has(s)).slice(0, 100);
    
    top100Symbols = new Set(symbols);
    
    // Pre-populate latestPrices so frontend knows immediately
    top100Symbols.forEach(sym => {
      if (!latestPrices[sym]) {
        latestPrices[sym] = { symbol: sym, price: null, timestamp: new Date() };
      }
    });

    console.log(`Tracking top ${top100Symbols.size} USDT symbols by Market Cap.`);
  } catch (err) {
    console.error('Error fetching coin lists, fallback to defaults.', err);
    top100Symbols = new Set(['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT']);
  }
}

async function connectBinanceWS() {
  if (top100Symbols.size === 0) {
    await fetchTop100Symbols();
  }

  binanceWs = new WebSocket(BINANCE_WS_URL);

  binanceWs.on('open', () => {
    console.log('Connected to Binance multi-ticker stream');
  });

  binanceWs.on('message', (data) => {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        let updated = false;
        parsed.forEach(ticker => {
          const symbol = ticker.s;
          // Only track coins within our top 100 filter
          if (top100Symbols.has(symbol)) {
            const newEntry = {
              symbol,
              price: parseFloat(ticker.c),
              timestamp: new Date()
            };
            latestPrices[symbol] = newEntry;
            chunkUpdates[symbol] = newEntry; // Track this delta
            updated = true;
          }
        });

        // Broadcast batched update every 500ms
        if (updated) {
          const now = Date.now();
          if (now - lastEmit >= 500) {
            priceEvents.emit('price_update', chunkUpdates);
            chunkUpdates = {}; // Flush buffer after emitting
            lastEmit = now;
          }
        }
      }
    } catch (err) {
      console.error('Error parsing Binance message:', err);
    }
  });

  binanceWs.on('close', () => {
    console.log('Binance WebSocket closed. Reconnecting in 3s...');
    setTimeout(connectBinanceWS, 3000);
  });

  binanceWs.on('error', (err) => {
    console.error('Binance WebSocket error:', err);
    binanceWs.close();
  });
}

// DB batch insert
setInterval(async () => {
  // Only attempt to save prices that have actually received real data (price not null)
  const pricesToSave = Object.values(latestPrices).filter(p => p.price !== null);
  if (pricesToSave.length === 0) return;

  try {
    const values = [];
    const queryParams = [];
    let counter = 1;

    for (const p of pricesToSave) {
      values.push(`($${counter}, $${counter + 1}, $${counter + 2})`);
      queryParams.push(p.symbol, p.price, p.timestamp);
      counter += 3;
    }

    const insertQuery = `
      INSERT INTO prices (symbol, price, timestamp) 
      VALUES ${values.join(', ')}
    `;

    await query(insertQuery, queryParams);
  } catch (err) {
    console.error('Error in batch insert:', err);
  }
}, 5000);

module.exports = {
  connectBinanceWS,
  priceEvents,
  getLatestPrices: () => latestPrices
};
