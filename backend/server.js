const express = require('express');
const cors = require('cors');
const http = require('http');
require('dotenv').config();

const { initDB } = require('./db/index');
const { connectBinanceWS } = require('./services/binance');
const { setupWebSocketServer } = require('./websocket/server');
const historyRoutes = require('./routes/history');

const app = express();
// Enable CORS for frontend requests
app.use(cors());
app.use(express.json());

// Basic health check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'Platform operational' });
});

app.use('/history', historyRoutes);

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

async function startServer() {
  // Initialize DB tables
  await initDB();
  
  // Start consuming Binance feed
  connectBinanceWS();

  // Attach WebSocket server
  setupWebSocketServer(server);

  server.listen(PORT, () => {
    console.log(`Backend server running on port ${PORT}`);
  });
}

startServer();
