import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Bell, Clock, Wifi, WifiOff, Sun, Moon } from 'lucide-react';

const PAGE_TITLES = {
  '/':        { title: 'Dashboard',      sub: 'Real-time battery system overview' },
  '/twin':    { title: 'BMS Digital Twin', sub: 'Interactive 3D pack visualization & live simulation' },
  '/cells':   { title: 'Cell Analytics', sub: 'Individual cell voltage monitoring & analysis' },
  '/sensors': { title: 'Sensor Monitor', sub: 'Current, temperature & gas sensor data' },
  '/ai':      { title: 'AI Insights',    sub: 'TinyML anomaly detection analytics' },
  '/faults':  { title: 'Fault Reports',  sub: 'Fault history, severity breakdown & management' },
  '/live':    { title: 'Live Stream',    sub: 'Real-time data stream & CSV export' },
  '/settings':{ title: 'System Config',  sub: 'Thresholds, relay control & system settings' },
  '/research':{ title: 'AI Research',    sub: 'Deep dive into predictive maintenance and historical trends' },
};

export default function Topbar({ connected, data }) {
  const [time, setTime] = useState(new Date());
  const [isDark, setIsDark] = useState(false);
  const location = useLocation();
  const meta = PAGE_TITLES[location.pathname] || { title: 'EV Guardian AI', sub: '' };

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setIsDark(saved === 'dark');
    if (saved === 'dark') document.documentElement.setAttribute('data-theme', 'dark');
    
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const toggleTheme = () => {
    const next = !isDark;
    setIsDark(next);
    if (next) {
      document.documentElement.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.removeAttribute('data-theme');
      localStorage.setItem('theme', 'light');
    }
  };

  const timeStr = time.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = time.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

  return (
    <header className="topbar">
      {/* Left: page title */}
      <div>
        <h1 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>{meta.title}</h1>
        <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{meta.sub}</p>
      </div>

      {/* Right: controls */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>

        {/* Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-3)' }}>
          <Clock size={13} />
          <span style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 500 }}>{timeStr}</span>
          <span style={{ fontSize: 11, color: 'var(--text-4)' }}>{dateStr}</span>
        </div>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Theme Toggle */}
        <button 
          onClick={toggleTheme}
          style={{ 
            background: 'none', border: 'none', cursor: 'pointer', 
            color: 'var(--text-3)', padding: 4, display: 'flex', 
            alignItems: 'center', justifyContent: 'center' 
          }}
          title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        {/* Divider */}
        <div style={{ width: 1, height: 20, background: 'var(--border)' }} />

        {/* Connection status */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '4px 10px',
          borderRadius: 6,
          background: connected ? 'var(--green-bg)' : 'var(--surface-3)',
          border: `1px solid ${connected ? 'var(--green-border)' : 'var(--border)'}`,
          fontSize: 11, fontWeight: 600,
          color: connected ? 'var(--green)' : 'var(--text-4)',
        }}>
          {connected ? <Wifi size={12} /> : <WifiOff size={12} />}
          {connected ? 'Live' : 'Offline'}
        </div>

        {/* Anomaly score pill */}
        {data && (
          <div style={{
            padding: '4px 10px',
            borderRadius: 6,
            background: data.status === 'Healthy' ? 'var(--green-bg)' : data.status === 'Warning' ? 'var(--amber-bg)' : 'var(--red-bg)',
            border: `1px solid ${data.status === 'Healthy' ? 'var(--green-border)' : data.status === 'Warning' ? 'var(--amber-border)' : 'var(--red-border)'}`,
            fontSize: 11, fontWeight: 700,
            color: data.status === 'Healthy' ? 'var(--green)' : data.status === 'Warning' ? 'var(--amber)' : 'var(--red)',
            fontFamily: 'var(--mono)',
          }}>
            AI: {data.anomalyScore?.toFixed(1)}%
          </div>
        )}
      </div>
    </header>
  );
}
