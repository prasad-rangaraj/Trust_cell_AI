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
    socket.on('battery:update', (basePayload) => {
      const now = Date.now();
      
      if (now - lastUpdate > 500 || basePayload.status !== 'Healthy') {
        setData(prev => {
          // Keep existing AI prediction if available, else empty default
          const aiPrediction = prev?.aiPrediction || {
              prediction: "NORMAL",
              probability: 1.0,
              source: "Unknown"
          };
          const payload = {
              ...basePayload,
              aiPrediction: aiPrediction,
          };
          
          setHistory((h) => {
            const next = [...h, { ...payload, ts: now }];
            return next.slice(-40);
          });
          
          return payload;
        });
        lastUpdate = now;
      }
    });

    // Listen to real Edge AI diagnostics from the MQTT broker via Backend
    socket.on('diagnostics:update', (diagData) => {
      setData(prev => {
          if (!prev) return prev;
          return {
              ...prev,
              aiPrediction: {
                  ...prev.aiPrediction,
                  prediction: diagData.prediction,
                  source: "Edge MQTT Engine (LSTM)",
                  soh_pct: diagData.soh_pct,
                  overall_trust: diagData.overall_trust
              }
          };
      });
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

