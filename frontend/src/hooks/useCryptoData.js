import { useState, useEffect, useRef } from 'react';

export function useCryptoData() {
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    let active = true;

    const connect = () => {
      if (wsRef.current) {
        if (wsRef.current.readyState === WebSocket.OPEN) {
          return;
        }
        if (wsRef.current.readyState === WebSocket.CONNECTING) {
          return;
        }
      }

      const wsUrl = import.meta.env.VITE_WS_URL || (
        window.location.hostname !== 'localhost' 
          ? 'wss://real-time-dashboard-1-hzy7.onrender.com' 
          : 'ws://localhost:5000'
      );
      
      console.log(`[WebSocket] Connecting to: ${wsUrl}`);
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) { ws.close(); return; }
        console.log('[WebSocket] Connection established');
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'init' || msg.type === 'update') {
            setPrices(prev => ({ ...prev, ...msg.data }));
          }
        } catch (err) {
          console.error('[WebSocket] Failed to parse message:', err);
        }
      };

      ws.onclose = (event) => {
        if (!active) return;
        console.warn(`[WebSocket] Connection closed (code: ${event.code}, reason: ${event.reason || 'none'})`);
        setIsConnected(false);
        wsRef.current = null;
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = (err) => {
        console.error('[WebSocket] Connection error:', err);
      };
    };

    connect();

    return () => {
      active = false;
      clearTimeout(reconnectRef.current);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, []);

  return { prices, isConnected };
}
