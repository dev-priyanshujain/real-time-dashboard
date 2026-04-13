import React, { useState, useMemo } from 'react';
import { useCryptoData } from './hooks/useCryptoData';
import { useAnalyticsData } from './hooks/useAnalyticsData';
import PriceTable from './components/PriceTable';
import ChartComponent from './components/ChartComponent';
import VolatilityIndicator from './components/VolatilityIndicator';
import './index.css';

function App() {
  const { prices, isConnected } = useCryptoData();
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');
  
  const currentSymbolData = useMemo(() => prices[selectedSymbol] || {}, [prices, selectedSymbol]);
  const { volatility } = useAnalyticsData(selectedSymbol, '1d');

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <div className="logo-section">
            <h1 className="logo">Antigravity</h1>
            <span className="logo-badge">Pro</span>
          </div>
          <div className="status-badge">
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
            <span className="status-text">{isConnected ? 'System UTC Online' : 'Attempting Connection…'}</span>
          </div>
        </div>
      </header>
      
      <main className="main-content binance-layout">
        <aside className="sidebar-section">
          <PriceTable 
             prices={prices} 
             selectedSymbol={selectedSymbol} 
             onSelectSymbol={setSelectedSymbol} 
          />
        </aside>

        <section className="chart-section">
          <div className="analytics-grid">
             <div className="main-stats-card">
                <div className="stats-header">
                  <span className="symbol-large">{selectedSymbol.replace('USDT', '')} / USDT</span>
                  <span className="price-large">
                    ${currentSymbolData.price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '---.--'}
                  </span>
                </div>
                <div className="stats-meta">
                  <div className="meta-item">
                    <span className="meta-label">24H Volume</span>
                    <span className="meta-value">${currentSymbolData.volume?.toLocaleString(undefined, { maximumFractionDigits: 0 }) || '0'}</span>
                  </div>
                  <div className="meta-item">
                    <span className="meta-label">UTC Timestamp</span>
                    <span className="meta-value">
                      {currentSymbolData.timestamp ? new Date(currentSymbolData.timestamp).toLocaleTimeString([], { timeZone: 'UTC', hour12: false }) : '--:--:--'}
                    </span>
                  </div>
                </div>
             </div>
             <VolatilityIndicator symbol={selectedSymbol} volatility={volatility} />
          </div>

          <div className="chart-wrapper-main">
            <ChartComponent symbol={selectedSymbol} livePrice={currentSymbolData} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
