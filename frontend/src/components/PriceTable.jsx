import React, { useState, useMemo } from 'react';
import PriceCard from './PriceCard';

const PriceTable = ({ prices, selectedSymbol, onSelectSymbol }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const symbols = useMemo(() => {
    const allSymbols = Object.keys(prices);
    let filtered = allSymbols;

    
    
    if (searchTerm) {
      filtered = allSymbols.filter(s => s.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    
    return filtered.sort((a, b) => {
      const volA = parseFloat(prices[a]?.volume) || 0;
      const volB = parseFloat(prices[b]?.volume) || 0;
      if (volA !== volB) return volB - volA;
      return a.localeCompare(b);
    });
  }, [prices, searchTerm]);

  return (
    <div className="price-table-container">
      <div className="sidebar-header">
        <h2 className="sidebar-title">Coins</h2>
        <span className="coin-count">{symbols.length} total</span>
      </div>
      <div className="search-container">
        <input 
          type="text" 
          placeholder="Search coin (e.g., SOL)" 
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>
      
      <div className="price-list-headers">
        <div className="header-pair">Pair</div>
        <div className="header-price">Last Price</div>
      </div>

      <div className="price-grid-wrapper">
        <div className="price-grid-vertical">
          {symbols.map(symbol => (
            <div key={symbol} onClick={() => onSelectSymbol(symbol)} className="price-card-wrapper">
              <PriceCard symbol={symbol} data={prices[symbol]} isSelected={selectedSymbol === symbol} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PriceTable;
