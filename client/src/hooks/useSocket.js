import { useEffect, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const SOCKET_URL = 'http://localhost:3001';

export function useSocket() {
  const [data, setData] = useState(null);
  const [connected, setConnected] = useState(false);
  const [history, setHistory] = useState([]);
  const [terminalLogs, setTerminalLogs] = useState([]);
  const socketRef = useRef(null);

  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket', 'polling'] });
    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    let lastUpdate = 0;
    socket.on('battery:update', (payload) => {
      const now = Date.now();
      // Throttle updates to max 2 per second to save CPU, unless it's an active warning/critical event
      if (now - lastUpdate > 500 || payload.status !== 'Healthy') {
        setData(payload);
        setHistory((prev) => {
          const next = [...prev, { ...payload, ts: now }];
          return next.slice(-40); // keep last 40 readings for charts
        });
        lastUpdate = now;
      }
    });

    socket.on('terminal:log', (logLine) => {
      setTerminalLogs((prev) => {
        const next = [...prev, { text: logLine, timestamp: new Date().toLocaleTimeString(), id: Math.random() }];
        return next.slice(-100); // keep last 100 log lines
      });
    });

    return () => socket.disconnect();
  }, []);

  return { data, connected, history, terminalLogs, socket: socketRef.current };
}

