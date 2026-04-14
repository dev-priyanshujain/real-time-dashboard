import React, { useEffect, useState, useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Chart } from 'react-chartjs-2';
import './ChartComponent.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  LineController,
  BarController,
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

const MAX_LIVE_POINTS = 50000;

const formatTickLabel = (timestamp, range) => {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (isNaN(d.getTime())) return "";
  
  switch (range) {
    case '1h':
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false, timeZone: 'UTC' });
    case '6h':
    case '1d':
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
    case '7d':
      return d.toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'UTC' });
    case '30d':
      return d.toLocaleDateString([], { month: 'short', day: 'numeric', timeZone: 'UTC' });
    default:
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' });
  }
};

const formatVolume = (vol) => {
  if (!vol) return "0";
  const num = parseFloat(vol);
  if (num >= 1e9) return (num / 1e9).toFixed(2) + "B";
  if (num >= 1e6) return (num / 1e6).toFixed(2) + "M";
  if (num >= 1e3) return (num / 1e3).toFixed(2) + "K";
  return num.toFixed(0);
};

const ChartComponent = ({ symbol, livePrice, historyData, loading, range, setRange }) => {
  // Round timestamp to nearest minute boundary for reliable matching
  const roundToMinute = (ts) => {
    const d = new Date(ts);
    d.setSeconds(0, 0);
    return d.getTime();
  };

  const displayData = useMemo(() => {
    const base = Array.isArray(historyData) ? [...historyData] : [];
    
    if (livePrice && livePrice.price !== null) {
      const lastData = base.length > 0 ? base[base.length - 1] : null;
      if (!lastData || new Date(livePrice.timestamp) > new Date(lastData.timestamp)) {
        base.push({
          price: livePrice.price,
          volume: livePrice.volume,
          timestamp: livePrice.timestamp,
        });
        if (base.length > MAX_LIVE_POINTS) {
          base.splice(0, base.length - MAX_LIVE_POINTS);
        }
      }
    }
    return base;
  }, [historyData, livePrice]);

  const mergedData = useMemo(() => {
    const volumeMap = new Map(
      Array.isArray(historyData) ? historyData.map((v) => [
        roundToMinute(v.timestamp),
        parseFloat(v.volume) || 0,
      ]) : []
    );

    return displayData.map((d, i) => {
      const prev = i > 0 ? displayData[i - 1] : null;
      const isUp = prev ? parseFloat(d.price) >= parseFloat(prev.price) : true;
      
      return {
        ...d,
        isUp,
        mergedVolume:
          volumeMap.get(roundToMinute(d.timestamp)) ||
          parseFloat(d.volume) ||
          0,
      };
    });
  }, [displayData, historyData]);

  const chartData = {
    labels: mergedData.map(d => formatTickLabel(d.timestamp, range)),
    datasets: [
      {
        type: 'line',
        label: `${symbol.replace('USDT', '')} Price`,
        data: mergedData.map(d => parseFloat(d.price) || 0),
        borderColor: '#6366f1',
        backgroundColor: (context) => {
          const chart = context.chart;
          const { ctx, chartArea } = chart;
          if (!chartArea || !ctx) return 'rgba(99, 102, 241, 0.1)';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, 'rgba(99, 102, 241, 0.15)');
          gradient.addColorStop(1, 'rgba(99, 102, 241, 0)');
          return gradient;
        },
        borderWidth: 2.5,
        tension: 0.1,
        fill: true,
        pointRadius: 0,
        pointHoverRadius: 6,
        pointBackgroundColor: '#6366f1',
        pointBorderColor: '#fff',
        pointBorderWidth: 2,
        yAxisID: 'y',
        order: 1,
      },
      {
        type: 'bar',
        label: 'Volume',
        data: mergedData.map(d => d.mergedVolume || 0),
        backgroundColor: mergedData.map(d => d.isUp ? 'rgba(16, 185, 129, 0.2)' : 'rgba(244, 63, 94, 0.2)'),
        borderColor: mergedData.map(d => d.isUp ? 'rgba(16, 185, 129, 0.4)' : 'rgba(244, 63, 94, 0.4)'),
        borderWidth: 1,
        yAxisID: 'y1',
        order: 2,
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
        backgroundColor: '#1e293b',
        titleColor: '#94a3b8',
        bodyColor: '#ffffff',
        padding: 12,
        cornerRadius: 8,
        titleFont: { family: 'Outfit', size: 12 },
        bodyFont: { family: 'JetBrains Mono', size: 12, weight: '600' },
        callbacks: {
          label: function (context) {
            if (context.dataset.yAxisID === "y1") {
              return "Volume: " + formatVolume(context.parsed.y);
            }
            return "Price: $" + context.parsed.y.toLocaleString(undefined, { maximumFractionDigits: 2 });
          },
        },
      },
    },
    scales: {
      x: { 
        display: true, 
        grid: { color: 'rgba(226, 232, 240, 0.4)', borderDash: [5, 5] },
        border: { display: false },
        ticks: { color: '#94a3b8', maxTicksLimit: 7, font: { family: 'Outfit', size: 10 } }
      },
      y: { 
        position: 'right',
        grid: { color: 'rgba(226, 232, 240, 0.4)', borderDash: [5, 5] },
        border: { display: false },
        ticks: { 
          color: '#64748b', 
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (val) => '$' + val.toLocaleString()
        },
        // IMPORTANT: Let chart focus on price range
        beginAtZero: false 
      },
      y1: {
        display: false,
        min: 0,
        max: (() => {
          if (mergedData.length === 0) return 1000;
          const vols = mergedData.map(d => d.mergedVolume || 0);
          const maxVol = Math.max(...vols, 0);
          return maxVol > 0 ? maxVol * 3.33 : 1000;
        })(),
      }
    },
    animation: { duration: 0 },
    interaction: { mode: 'nearest', axis: 'x', intersect: false }
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
          <Chart type="bar" data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default ChartComponent;
