import { useState, useEffect } from 'react';
import { Download, Database, Server, Clock, Terminal } from 'lucide-react';

export default function LiveStream({ data, history, terminalLogs = [] }) {
  const [health, setHealth] = useState(null);
  const [stats, setStats] = useState(null);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const load = () => {
      fetch('/api/system/health').then(r => r.json()).then(d => d.success && setHealth(d.data)).catch(() => {});
      fetch('/api/system/stats').then(r => r.json()).then(d => d.success && setStats(d.data)).catch(() => {});
    };
    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const exportCSV = async () => {
    setExporting(true);
    try {
      const r = await fetch('/api/system/export?format=csv&limit=200');
      const blob = await r.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `think360_export_${Date.now()}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } finally { setExporting(false); }
  };

  const lastReading = history[history.length - 1] || data;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div>
          <h1 className="page-title" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <Terminal size={24} color="var(--blue)" /> Live Data Stream
          </h1>
          <p className="page-sub">Raw MQTT payloads, hardware serial logs, and Postgres sync status</p>
        </div>
        <button className="btn btn-primary" onClick={exportCSV} disabled={exporting}>
          <Download size={14} />{exporting ? 'Exporting...' : 'Export CSV Dump'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 14 }}>
        {[
          { label: 'Cloud DB', value: health?.db ?? '...', icon: Database, color: health?.db === 'connected' ? 'var(--green)' : 'var(--red)' },
          { label: 'Edge Server', value: health?.server ?? '...', icon: Server, color: health?.server === 'online' ? 'var(--green)' : 'var(--red)' },
          { label: 'Write Latency', value: health?.dbLatency ?? '--', icon: Clock, color: 'var(--blue)' },
          { label: 'Broker Uptime', value: health ? `${Math.floor(health.uptime/60)}m ${health.uptime%60}s` : '--', icon: Clock, color: 'var(--text)' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bento-item animate-in" style={{ padding: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span className="stat-label" style={{ fontSize: 11 }}>{label}</span><Icon size={14} color={color} />
            </div>
            <div className="stat-value" style={{ color, fontSize: 20, marginTop: 12 }}>{value}</div>
          </div>
        ))}
      </div>

      {/* Terminal View Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 10 }}>
        
        {/* Terminal 1: MQTT JSON Payload */}
        <div className="terminal-window" style={{ height: '400px', display: 'flex', flexDirection: 'column' }}>
          <div className="terminal-header">
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', animation: 'dot-pulse 1s infinite' }}/> battery/live (MQTT)</span>
            <span style={{ color: 'rgba(0, 229, 255, 0.5)' }}>QoS 0</span>
          </div>
          <div className="terminal-body" style={{ flex: 1 }}>
            {`> LISTENING ON PORT 1883...\n> RECEIVED PAYLOAD:\n`}
            {JSON.stringify({ 
              cell1: lastReading?.cell1 ? parseFloat(lastReading.cell1.toFixed(3)) : null, 
              cell2: lastReading?.cell2 ? parseFloat(lastReading.cell2.toFixed(3)) : null, 
              cell3: lastReading?.cell3 ? parseFloat(lastReading.cell3.toFixed(3)) : null, 
              cell4: lastReading?.cell4 ? parseFloat(lastReading.cell4.toFixed(3)) : null, 
              current: lastReading?.current ? parseFloat(lastReading.current.toFixed(2)) : null, 
              temperature: lastReading?.temperature ? parseFloat(lastReading.temperature.toFixed(1)) : null, 
              gas: lastReading?.gas ? Math.round(lastReading.gas) : null, 
              batteryHealth: lastReading?.batteryHealth ? parseFloat(lastReading.batteryHealth.toFixed(1)) : null, 
              anomalyScore: lastReading?.anomalyScore ? parseFloat(lastReading.anomalyScore.toFixed(1)) : null, 
              status: lastReading?.status, 
              relay: lastReading?.relay 
            }, null, 2)}
            <span className="terminal-blink">_</span>
          </div>
        </div>

        {/* Terminal 2: Hardware Serial */}
        <div className="terminal-window" style={{ height: '400px', display: 'flex', flexDirection: 'column', color: '#38ef7d', borderColor: 'rgba(56, 239, 125, 0.2)' }}>
          <div className="terminal-header" style={{ borderBottomColor: 'rgba(56, 239, 125, 0.2)' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}><div style={{ width: 8, height: 8, borderRadius: '50%', background: '#38ef7d', animation: 'dot-pulse 1s infinite' }}/> /dev/ttyACM0 (SERIAL)</span>
             <span style={{ color: 'rgba(56, 239, 125, 0.5)' }}>115200 baud</span>
          </div>
          <div className="terminal-body" style={{ flex: 1, display: 'flex', flexDirection: 'column-reverse' }}>
            <div>
               <span className="terminal-blink">_</span>
               {terminalLogs && terminalLogs.length > 0 ? (
                  [...terminalLogs].reverse().map((log) => (
                    <div key={log.id} style={{ marginBottom: 4 }}>
                      <span style={{ color: 'rgba(56, 239, 125, 0.4)', marginRight: 8 }}>[{log.timestamp}]</span>
                      {log.text}
                    </div>
                  ))
                ) : (
                  <div style={{ color: 'rgba(56, 239, 125, 0.4)', fontStyle: 'italic' }}>
                    {'>'} WAITING FOR SERIAL DATA...
                  </div>
                )}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
