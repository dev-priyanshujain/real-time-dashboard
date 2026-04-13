import { useState, useEffect } from 'react';

export const useAnalyticsData = (symbol, range) => {
  const [volatility, setVolatility] = useState(null);
  const [volumeData, setVolumeData] = useState([]);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
        // Note: We use the history endpoint but extract volume/volatility from the rich response
        // In the current backend, volume is part of the history response
        const res = await fetch(`${apiUrl}/history?symbol=${symbol}&range=${range}`);
        const data = await res.json();
        
        if (Array.isArray(data)) {
          setVolumeData(data);
          
          // Simple volatility calculation if not provided by backend: 
          // (StdDev of prices / Mean price)
          if (data.length > 1) {
            const prices = data.map(d => parseFloat(d.price));
            const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
            const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
            setVolatility(Math.sqrt(variance) / mean);
          }
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      }
    };

    if (symbol) {
      fetchAnalytics();
    }
  }, [symbol, range]);

  return { volatility, volumeData };
};
