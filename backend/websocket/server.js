const WebSocket = require('ws');
const { priceEvents, getLatestPrices } = require('../services/binance');

function setupWebSocketServer() {
  const wss = new WebSocket.Server({ noServer: true });

  wss.on('connection', (ws) => {
    console.log('Client connected');
    
    try {
      ws.send(JSON.stringify({ type: 'init', data: getLatestPrices() }));
    } catch (err) {
      console.error('Failed to send init payload:', err.message);
      return;
    }

    const sendUpdate = (data) => {
      if (ws.readyState === WebSocket.OPEN) {
        try {
          ws.send(JSON.stringify({ type: 'update', data }));
        } catch (err) {
          // Client went away mid-send, ignore
        }
      }
    };

    priceEvents.on('price_update', sendUpdate);

    // Heartbeat to keep connection alive on proxies like Render/Vercel
    ws.isAlive = true;
    ws.on('pong', () => { ws.isAlive = true; });
    
    const interval = setInterval(() => {
      if (ws.isAlive === false) return ws.terminate();
      ws.isAlive = false;
      ws.ping();
    }, 30000);

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
      clearInterval(interval);
      priceEvents.off('price_update', sendUpdate);
    };

    ws.on('error', (err) => {
      console.error('WebSocket client error:', err.message);
      cleanup();
    });

    ws.on('close', (code) => {
      cleanup();
      if (code !== 1000 && code !== 1001) {
        console.warn(`Client disconnected abnormally (code ${code})`);
      }
    });
  });

  return wss;
}

module.exports = { setupWebSocketServer };
