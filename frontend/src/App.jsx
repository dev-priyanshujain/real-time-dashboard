import React, { useState } from 'react';
import { useCryptoData } from './hooks/useCryptoData';
import PriceTable from './components/PriceTable';
import ChartComponent from './components/ChartComponent';
import './index.css';

function App() {
  const { prices, isConnected } = useCryptoData();
  const [selectedSymbol, setSelectedSymbol] = useState('BTCUSDT');

  return (
    <div className="app-container">
      <header className="header">
        <div className="header-content">
          <h1 className="logo">Ledger</h1>
          <div className="status-badge">
            <span className={`status-dot ${isConnected ? 'online' : 'offline'}`}></span>
            {isConnected ? 'Connected' : 'Reconnecting…'}
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
          <ChartComponent symbol={selectedSymbol} livePrice={prices[selectedSymbol]} />
        </section>
      </main>
    </div>
  );
}

export default App;
