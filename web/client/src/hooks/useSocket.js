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
      
      // Merge with simulated Trust Engine data based on user payload
      // We will cycle through State 1 (Normal), State 2 (Overtemp), State 3 (Sensor Fault)
      // for demonstration based on the anomaly score or a random timer, but for now we'll
      // just construct a rich mock object that maps to the new requirements.
      
      const isOvertemp = basePayload.status === 'Critical' || basePayload.temp1 > 30;
      const isSensorFault = basePayload.anomalyScore > 60 && basePayload.temp1 < 30; // Mock condition
      
      let predictionStr = "NORMAL";
      let sourceStr = "LSTM";
      let sohConf = 0.3000;
      let rulConf = 0.3000;
      let riskScore = 10.00;
      let batFaultPred = null;
      let trustScore = 98;
      let trustSev = "NORMAL";
      
      if (isSensorFault) {
          predictionStr = "SENSOR_FAULT";
          sourceStr = "Sensor Trust Engine";
          sohConf = 0.0000;
          rulConf = 0.0000;
          riskScore = 100.00;
          trustScore = 45;
          trustSev = "CRITICAL";
          batFaultPred = { prediction: "OVERTEMPERATURE", probability: 0.0000, source: "LSTM (Scale-Down Confidence)" };
      } else if (isOvertemp) {
          predictionStr = "OVERTEMPERATURE";
          riskScore = 100.00;
          trustScore = 95;
          trustSev = "WARNING";
      }

      const payload = {
          ...basePayload,
          aiPrediction: {
              prediction: predictionStr,
              probability: 1.0000,
              raw_prediction: predictionStr,
              source: sourceStr,
              soh_pct: 100.0,
              soh_confidence: sohConf,
              rul_cycles: 700,
              rul_confidence: rulConf,
              risk_score: riskScore,
              battery_fault_prediction: batFaultPred
          },
          sensorExecution: {
              voltage: 0,
              current: 256,
              temperature: 72,
              gas: 392,
              total: 720
          },
          trustEngine: {
              overallScore: trustScore,
              severity: trustSev,
              confidence: 98.50,
              individual: {
                  cell1: 99, cell2: 99, cell3: 99, cell4: 99,
                  current: 97, temp: 98, gas: 99, vibration: isSensorFault ? 20 : 95
              },
              anomalousSensors: isSensorFault ? ["Vibration Sensor"] : ["None"],
              recommendation: isSensorFault ? "Isolate vibration sensor data. Check wiring." : "BMS status normal.",
              aiAllowed: isSensorFault ? "NO" : "YES"
          },
          imu: {
              accel: { x: -0.193, y: -0.190, z: 0.803 },
              gyro: { x: 26.6, y: -6.7, z: -1.2 },
              vibMag: 0.152
          }
      };

      if (now - lastUpdate > 500 || payload.status !== 'Healthy') {
        setData(payload);
        setHistory((prev) => {
          const next = [...prev, { ...payload, ts: now }];
          return next.slice(-40);
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

