const WebSocket = require('ws');
const { priceEvents, getLatestPrices } = require('../services/binance');

function setupWebSocketServer(server) {
  const wss = new WebSocket.Server({ server });

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

    let cleanedUp = false;
    const cleanup = () => {
      if (cleanedUp) return;
      cleanedUp = true;
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
