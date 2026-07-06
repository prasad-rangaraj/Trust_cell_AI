import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';
import { API_URL } from '../config';

export function useSocket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(API_URL, { transports: ['websocket', 'polling'], reconnectionAttempts: 10 });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    let lastUpdate = 0;
    socket.on('battery:update', (payload) => {
      const now = Date.now();
      if (now - lastUpdate > 500 || payload.status !== 'Healthy') {
        setData(payload);
        setHistory(prev => [...prev, { ...payload, ts: now }].slice(-40));
        lastUpdate = now;
      }
    });

    return () => socket.disconnect();
  }, []);

  return { data, connected, history, socket: socketRef.current };
}
