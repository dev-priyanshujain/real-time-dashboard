import React, { memo, useRef, useEffect } from 'react';
import './PriceCard.css';

const PriceCard = memo(({ symbol, data, isSelected }) => {
  const priceRef = useRef(null);
  const prevPriceRef = useRef(data?.price);

  useEffect(() => {
    if (!priceRef.current || !data?.price) return;
    
    const currentPrice = data.price;
    const prevPrice = prevPriceRef.current;
    
    if (prevPrice && currentPrice !== prevPrice) {
      const isUp = currentPrice > prevPrice;
      priceRef.current.classList.add(isUp ? 'flash-up-text' : 'flash-down-text');
      
      setTimeout(() => {
        if (priceRef.current) {
            priceRef.current.classList.remove('flash-up-text', 'flash-down-text');
        }
      }, 400);
    }
    
    prevPriceRef.current = currentPrice;
  }, [data?.price]);

  return (
    <div className={`price-row ${isSelected ? 'selected' : ''}`}>
      <div className="item-symbol">
        <span className="coin">{symbol.replace('USDT', '')}</span>
        <span className="pair">/USDT</span>
      </div>
      <div ref={priceRef} className="item-price">
        {data?.price ? data.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 6 }) : '---.--'}
      </div>
    </div>
  );
});

export default PriceCard;
