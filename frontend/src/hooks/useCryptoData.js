import { useState, useEffect, useRef } from 'react';

export function useCryptoData() {
  const [prices, setPrices] = useState({});
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectRef = useRef(null);

  useEffect(() => {
    let active = true;

    const connect = () => {
      // Don't open a second socket if one is already live
      if (wsRef.current && wsRef.current.readyState <= WebSocket.OPEN) {
        return;
      }

      const wsUrl = import.meta.env.VITE_WS_URL || 'ws://localhost:5000';
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!active) { ws.close(); return; }
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (!active) return;
        try {
          const msg = JSON.parse(event.data);
          if (msg.type === 'init' || msg.type === 'update') {
            setPrices(prev => ({ ...prev, ...msg.data }));
          }
        } catch { /* malformed JSON, skip */ }
      };

      ws.onclose = () => {
        if (!active) return;
        setIsConnected(false);
        wsRef.current = null;
        reconnectRef.current = setTimeout(connect, 3000);
      };

      ws.onerror = () => {
        // onerror always fires before onclose, so just let onclose handle cleanup
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
