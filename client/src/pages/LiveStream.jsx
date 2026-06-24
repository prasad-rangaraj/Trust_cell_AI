import { useState, useEffect, useRef } from 'react';
import { Download, Database, Server, Clock, Terminal, Activity, Wifi, AlertCircle, Package } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

export default function LiveStream({ data, history, terminalLogs = [] }) {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);
  const [packetRateData, setPacketRateData] = useState([]);
  const [dataQuality, setDataQuality] = useState({ total: 0, valid: 0 });
  const lastCountRef = useRef(0);
  const tickRef = useRef(0);

  useEffect(() => {
    const load = () => {
      fetch('/api/system/health').then(r => r.json()).then(d => d.success && setHealth(d.data)).catch(() => {});
      fetch('/api/system/stats').then(r => r.json()).then(d => d.success && setStats(d.data)).catch(() => {});
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  // Packet rate tracker — measures packets/s
  useEffect(() => {
    const interval = setInterval(() => {
      const currentCount = history.length;
      const rate = currentCount - lastCountRef.current;
      lastCountRef.current = currentCount;
      tickRef.current += 1;
      const label = `T${tickRef.current}`;
      setPacketRateData(prev => [...prev, { t: label, rate: Math.max(0, rate) }].slice(-30));
    }, 1000);
    return () => clearInterval(interval);
  }, [history]);

  // Data Quality: count non-null sensor values in last N packets
  useEffect(() => {
    const recent = history.slice(-50);
    const fields = ['cell1', 'cell2', 'cell3', 'cell4', 'temp1', 'temp2', 'current', 'gas', 'vibration', 'anomalyScore'];
    let total = 0, valid = 0;
    recent.forEach(h => {
      fields.forEach(f => {
        total++;
        if (h[f] != null && !isNaN(h[f])) valid++;
      });
    });
    setDataQuality({ total, valid });
  }, [history]);

  const qualityPct = dataQuality.total > 0 ? Math.round((dataQuality.valid / dataQuality.total) * 100) : 100;
  const qualityColor = qualityPct >= 95 ? 'var(--green)' : qualityPct >= 80 ? 'var(--amber)' : 'var(--red)';

  const exportCSV = async () => {
    setExporting(true);
    try {
      const r = await fetch('/api/system/export?format=csv&limit=200');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `cat_edge_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const lastReading = history[history.length - 1] || data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Terminal size={24} color="var(--blue)" /> Data Pipeline Inspector
          </h1>
          <p className="page-sub">MQTT flow rate · DB write queue · Data quality score · Raw payload viewer</p>
        </div>
        <button className="btn btn-primary" onClick={exportCSV} disabled={exporting}>
          <Download size={14} />{exporting ? 'Exporting...' : 'Export CSV Dump'}
        </button>
      </div>

      {/* Infrastructure Status Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Cloud DB', value: health?.db ?? '…', icon: Database, color: health?.db === 'connected' ? 'var(--green)' : 'var(--red)', sub: 'PostgreSQL' },
          { label: 'Edge Server', value: health?.server ?? '…', icon: Server, color: health?.server === 'online' ? 'var(--green)' : 'var(--red)', sub: 'Node.js / Express' },
          { label: 'Write Latency', value: health?.dbLatency ?? '--', icon: Clock, color: 'var(--blue)', sub: 'avg per insert' },
          { label: 'Broker Uptime', value: health ? `${Math.floor(health.uptime / 60)}m ${health.uptime % 60}s` : '--', icon: Wifi, color: 'var(--text)', sub: 'MQTT Broker' },
        ].map(({ label, value, icon: Icon, color, sub }) => (
          <div key={label} className="bento-item animate-in" style={{ padding: 16, borderTop: `2px solid ${color}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label" style={{ fontSize: 11 }}>{label}</span>
              <Icon size={16} color={color} />
            </div>
            <div className="stat-value" style={{ color, fontSize: 20, marginTop: 12 }}>{value}</div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 4, fontWeight: 600 }}>{sub}</div>
          </div>
        ))}
      </div>

      {/* Pipeline Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 200px', gap: 20 }}>

        {/* MQTT Packet Rate Chart */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Activity size={15} color="var(--blue)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>MQTT Packet Rate</span>
            </div>
            <span className="badge badge-blue">packets / sec</span>
          </div>
          <div className="card-body">
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={packetRateData} margin={{ top: 5, right: 10, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="t" stroke="var(--text-4)" tick={{ fontSize: 9, fill: 'var(--text-4)' }} interval={4} />
                  <YAxis stroke="var(--text-4)" tick={{ fontSize: 10, fill: 'var(--text-3)' }} allowDecimals={false} />
                  <Tooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} />
                  <Bar dataKey="rate" fill="var(--blue)" radius={[3, 3, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* DB Write Queue visual */}
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Package size={15} color="var(--yellow)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Database Records</span>
            </div>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {[
              { label: 'Packets Received', val: history.length, color: 'var(--blue)' },
              { label: 'Fault Events Logged', val: stats?.totalFaults ?? '--', color: 'var(--red)' },
              { label: 'DB Readings Stored', val: stats?.totalReadings ?? '--', color: 'var(--green)' },
              { label: 'Anomaly Events', val: stats?.totalAnomalies ?? '--', color: 'var(--amber)' },
            ].map(({ label, val, color }) => (
              <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>{label}</span>
                <span style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--mono)' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Data Quality Score */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Data Quality</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
            <div style={{ position: 'relative', width: 120, height: 120 }}>
              <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                <circle cx="18" cy="18" r="15.9" fill="none" stroke="var(--surface-2)" strokeWidth="3" />
                <circle cx="18" cy="18" r="15.9" fill="none" stroke={qualityColor} strokeWidth="3"
                  strokeDasharray={`${qualityPct} ${100 - qualityPct}`} strokeLinecap="round" />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 22, fontWeight: 900, color: qualityColor, fontFamily: 'var(--mono)' }}>{qualityPct}%</span>
              </div>
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', textAlign: 'center', fontWeight: 600 }}>
              {dataQuality.valid}/{dataQuality.total} valid fields
            </div>
          </div>
        </div>

      </div>

      {/* Raw Payload Terminals */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <div className="terminal-window" style={{ height: 360, display: 'flex', flexDirection: 'column' }}>
          <div className="terminal-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', animation: 'dot-pulse 1s infinite' }} />
              battery/live (MQTT)
            </span>
            <span style={{ color: 'rgba(0,229,255,0.5)' }}>QoS 0</span>
          </div>
          <div className="terminal-body" style={{ flex: 1 }}>
            {`> LISTENING ON PORT 1883...\n> RECEIVED PAYLOAD:\n`}
            {JSON.stringify({
              cell1: lastReading?.cell1 ? parseFloat(lastReading.cell1.toFixed(3)) : null,
              cell2: lastReading?.cell2 ? parseFloat(lastReading.cell2.toFixed(3)) : null,
              cell3: lastReading?.cell3 ? parseFloat(lastReading.cell3.toFixed(3)) : null,
              cell4: lastReading?.cell4 ? parseFloat(lastReading.cell4.toFixed(3)) : null,
              current: lastReading?.current ? parseFloat(lastReading.current.toFixed(2)) : null,
              temp1: lastReading?.temp1 ? parseFloat(lastReading.temp1.toFixed(1)) : null,
              temp2: lastReading?.temp2 ? parseFloat(lastReading.temp2.toFixed(1)) : null,
              gas: lastReading?.gas ? Math.round(lastReading.gas) : null,
              vibration: lastReading?.vibration ? parseFloat(lastReading.vibration.toFixed(2)) : null,
              batteryHealth: lastReading?.batteryHealth ? parseFloat(lastReading.batteryHealth.toFixed(1)) : null,
              anomalyScore: lastReading?.anomalyScore ? parseFloat(lastReading.anomalyScore.toFixed(1)) : null,
              status: lastReading?.status,
              relay: lastReading?.relay
            }, null, 2)}
            <span className="terminal-blink">_</span>
          </div>
        </div>

        <div className="terminal-window" style={{ height: 360, display: 'flex', flexDirection: 'column', color: '#38ef7d', borderColor: 'rgba(56,239,125,0.2)' }}>
          <div className="terminal-header" style={{ borderBottomColor: 'rgba(56,239,125,0.2)' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38ef7d', animation: 'dot-pulse 1s infinite' }} />
              /dev/ttyACM0 (SERIAL)
            </span>
            <span style={{ color: 'rgba(56,239,125,0.5)' }}>115200 baud</span>
          </div>
          <div className="terminal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse' }}>
            <div>
              <span className="terminal-blink">_</span>
              {terminalLogs && terminalLogs.length > 0 ? (
                [...terminalLogs].reverse().map((log) => (
                  <div key={log.id} style={{ marginBottom: 4 }}>
                    <span style={{ color: 'rgba(56,239,125,0.4)', marginRight: 8 }}>[{log.timestamp}]</span>{log.text}
                  </div>
                ))
              ) : (
                <div style={{ color: 'rgba(56,239,125,0.4)', fontStyle: 'italic' }}>{'>'} WAITING FOR SERIAL DATA...</div>
              )}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
