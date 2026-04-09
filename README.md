# Ledger — Real-Time Cryptocurrency Dashboard

A production-grade, real-time cryptocurrency price tracker built with Node.js, WebSockets, PostgreSQL, and React.

Tracks the **top 100 coins by market capitalization** with live price feeds from Binance, persistent historical data, and an interactive chart.

## Architecture

```
Binance WebSocket ──▶ Node.js Aggregator ──▶ PostgreSQL (batch writes every 5s)
                              │
                              ▼
                     WebSocket Server (throttled 500ms)
                              │
                              ▼
                     React Frontend (Vite)
```

## Tech Stack

| Layer     | Technology                         |
|-----------|------------------------------------|
| Backend   | Node.js, Express, ws               |
| Database  | PostgreSQL (Neon Serverless)        |
| Frontend  | React 19, Vite, Chart.js           |
| Data Feed | Binance WebSocket `!miniTicker@arr` |
| Hosting   | Render                              |

## Local Development

### Prerequisites
- Node.js 18+
- A PostgreSQL database (e.g. [Neon](https://neon.tech))

### Backend
```bash
cd backend
cp .env.example .env   # fill in your DATABASE_URL
npm install
npm start
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

## Environment Variables

### Backend (`backend/.env`)
| Variable       | Description              |
|----------------|--------------------------|
| `DATABASE_URL` | PostgreSQL connection URL |
| `PORT`         | Server port (default 5000) |

### Frontend (`frontend/.env`)
| Variable       | Description                              |
|----------------|------------------------------------------|
| `VITE_WS_URL`  | Backend WebSocket URL                    |
| `VITE_API_URL`  | Backend REST API URL                     |

## Deployment (Render)

This project is configured for deployment on [Render](https://render.com) as two services:

1. **Backend** — Web Service (Node.js)
2. **Frontend** — Static Site (Vite build)

See the `render.yaml` in the repo root for infrastructure-as-code configuration.

## License

MIT
