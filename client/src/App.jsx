import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { useSocket } from './hooks/useSocket';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import CellAnalytics from './pages/CellAnalytics';
import SensorMonitor from './pages/SensorMonitor';
import AIInsights from './pages/AIInsights';
import FaultReports from './pages/FaultReports';
import LiveStream from './pages/LiveStream';
import SystemConfig from './pages/SystemConfig';
import Research from './pages/Research';
import DigitalTwin from './pages/DigitalTwin';

const DEMO_DATA = {
  cell1: 4.01, cell2: 4.02, cell3: 3.98, cell4: 4.00,
  current: 2.1, temperature: 34, gas: 120,
  batteryHealth: 96.2, anomalyScore: 4,
  status: 'Healthy', relay: 'CONNECTED',
};

export default function App() {
  const { data: liveData, connected, history, terminalLogs } = useSocket();
  const [toasts, setToasts] = useState([]);

  const data = liveData || DEMO_DATA;

  function addToast(toast) {
    const id = Date.now();
    setToasts(prev => [{ ...toast, id }, ...prev].slice(0, 4));
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }

  useEffect(() => {
    if (!liveData) return;
    if (liveData.status === 'Warning') {
      addToast({ type: 'warning', message: 'AI Warning: Anomaly Detected', sub: `Score: ${liveData.anomalyScore?.toFixed(1)}%` });
    } else if (liveData.status === 'Critical') {
      addToast({ type: 'critical', message: 'CRITICAL: Relay Action Taken', sub: 'Battery pack isolated' });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [liveData?.status]);

  const pageProps = { data, history, terminalLogs };


  return (
    <BrowserRouter>
      <Layout data={data} connected={connected} toasts={toasts}>
        <Routes>
          <Route path="/"         element={<Dashboard    {...pageProps} />} />
          <Route path="/twin"     element={<DigitalTwin  {...pageProps} />} />
          <Route path="/cells"    element={<CellAnalytics {...pageProps} />} />
          <Route path="/sensors"  element={<SensorMonitor {...pageProps} />} />
          <Route path="/ai"       element={<AIInsights    {...pageProps} />} />
          <Route path="/research" element={<Research      {...pageProps} />} />
          <Route path="/faults"   element={<FaultReports  {...pageProps} />} />
          <Route path="/live"     element={<LiveStream    {...pageProps} />} />
          <Route path="/settings" element={<SystemConfig  {...pageProps} />} />
          <Route path="*"         element={<Dashboard    {...pageProps} />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
