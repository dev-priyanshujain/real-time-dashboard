import { useState, useEffect } from 'react';

export const useAnalyticsData = (symbol, range) => {
  const [volatility, setVolatility] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      try {
        const apiUrl = import.meta.env.VITE_API_URL || (
          window.location.hostname !== 'localhost' 
            ? 'https://real-time-dashboard-1-hzy7.onrender.com' 
            : 'http://localhost:5000'
        );
        
        const fetchUrl = `${apiUrl}/history?symbol=${symbol}&range=${range}`;
        console.log(`[Analytics] Fetching: ${fetchUrl}`);
        
        const res = await fetch(fetchUrl);
        if (!res.ok) {
          throw new Error(`Server responded with ${res.status}: ${res.statusText}`);
        }
        
        const data = await res.json();
        console.log(`[Analytics] Received ${Array.isArray(data) ? data.length : 'non-array'} data points`);
        
        if (Array.isArray(data)) {
          setHistoryData(data);
          
          if (data.length > 1) {
            const prices = data.map(d => parseFloat(d.price));
            const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
            const variance = prices.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / prices.length;
            setVolatility(Math.sqrt(variance) / mean);
          }
        }
      } catch (err) {
        console.error('[Analytics] Fetch failed:', err.message);
      } finally {
        setLoading(false);
      }
    };

    if (symbol) {
      fetchAnalytics();
    }
  }, [symbol, range]);

  return { volatility, historyData, loading };
};
