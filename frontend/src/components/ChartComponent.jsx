import React, { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import './ChartComponent.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const RANGES = [
  { key: '1h', label: '1H' },
  { key: '6h', label: '6H' },
  { key: '1d', label: '1D' },
  { key: '7d', label: '7D' },
  { key: '30d', label: '30D' },
];

const MAX_LIVE_POINTS = 60;

const formatTickLabel = (timestamp, range) => {
  const d = new Date(timestamp);
  switch (range) {
    case '1h':
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case '6h':
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case '1d':
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    case '7d':
      return d.toLocaleDateString([], { weekday: 'short', hour: '2-digit' });
    case '30d':
      return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
    default:
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
};

const ChartComponent = ({ symbol, livePrice }) => {
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState('1d');

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        const res = await fetch(`${apiUrl}/history?symbol=${symbol}&range=${range}`);
        const data = await res.json();
        setHistoryData(data);
      } catch (err) {
        console.error('Error fetching history:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, [symbol, range]);

  const displayData = Array.isArray(historyData) ? [...historyData] : [];
  if (livePrice && livePrice.price !== null && displayData.length > 0) {
     const lastData = displayData[displayData.length - 1];
     if (new Date(livePrice.timestamp) > new Date(lastData.timestamp)) {
         displayData.push({ price: livePrice.price, timestamp: livePrice.timestamp });
         if (displayData.length > MAX_LIVE_POINTS) {
           const cutoff = displayData.length - MAX_LIVE_POINTS;
           displayData.splice(0, cutoff);
         }
     }
  }

  const chartData = {
    labels: displayData.map(d => formatTickLabel(d.timestamp, range)),
    datasets: [
      {
        label: `${symbol.replace('USDT', '')} Price`,
        data: displayData.map(d => parseFloat(d.price) || 0),
        borderColor: '#111827',
        backgroundColor: (context) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(17, 24, 39, 0.08)');
          gradient.addColorStop(1, 'rgba(17, 24, 39, 0.0)');
          return gradient;
        },
        borderWidth: 1.5,
        tension: 0.15,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointBackgroundColor: '#ffffff',
        pointBorderColor: '#111827',
        pointBorderWidth: 1.5,
      }
    ]
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: '#111827',
        titleColor: '#9ca3af',
        bodyColor: '#ffffff',
        borderColor: '#374151',
        borderWidth: 0,
        padding: 10,
        displayColors: false,
        cornerRadius: 4,
        titleFont: { family: 'Inter', size: 11 },
        bodyFont: { family: 'Inter', size: 12, weight: '600' }
      },
    },
    scales: {
      x: { 
        display: true, 
        grid: { display: false },
        border: { display: false },
        ticks: { color: '#9ca3af', maxTicksLimit: 6, font: { family: 'Inter', size: 10 } }
      },
      y: { 
        display: true, 
        grid: { color: '#f3f4f6', drawBorder: false },
        border: { display: false },
        ticks: { color: '#9ca3af', font: { family: 'Inter', size: 10 } }
      }
    },
    animation: {
      duration: 0
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false
    }
  };

  return (
    <div className="chart-container">
      <div className="chart-header">
        <h2 className="chart-title">{symbol.replace('USDT', '')} / USDT</h2>
        <div className="range-selector">
          {RANGES.map(r => (
            <button
              key={r.key}
              className={`range-btn ${range === r.key ? 'active' : ''}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>
      <div className="chart-wrapper">
        {loading ? (
          <div className="chart-loading">
             <div className="spinner"></div>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default ChartComponent;
