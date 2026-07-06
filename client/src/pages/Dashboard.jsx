import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis, BarChart, Bar, XAxis, Tooltip, CartesianGrid } from 'recharts';
import SafetyBanner from '../components/dashboard/SafetyBanner';
import BatteryHealthCard from '../components/dashboard/BatteryHealthCard';
import AIStatusCard from '../components/dashboard/AIStatusCard';
import ProtectionStatus from '../components/dashboard/ProtectionStatus';
import { Activity, Battery, Cpu, Brain, Zap, AlertTriangle, CheckCircle, Clock, TrendingUp, Radio } from 'lucide-react';

const iV = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };
const cV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

function MiniStat({ label, value, sub, color = 'var(--text)', icon: Icon, historyData, dataKey }) {
  const isDanger = color === 'var(--red)' || color === 'var(--amber)';
  return (
    <motion.div variants={iV} className="bento-item" style={{ padding: 20, gap: 12, justifyContent: 'space-between', borderTop: `3px solid ${color}` }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span className="stat-label" style={{ color: 'var(--text-3)', letterSpacing: '0.05em' }}>{label}</span>
          <div className="stat-value" style={{ color: 'var(--text)', fontSize: 36, marginTop: 4, textShadow: isDanger ? `0 0 12px color-mix(in srgb, ${color} 40%, transparent)` : 'none' }}>{value}</div>
          {sub && <div className="stat-sub" style={{ color: color !== 'var(--text)' ? color : 'var(--text-4)', fontWeight: 600, marginTop: 2 }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ background: `color-mix(in srgb, ${color} 15%, transparent)`, padding: 10, borderRadius: 12, boxShadow: `0 0 20px color-mix(in srgb, ${color} 20%, transparent)` }}>
            <Icon size={24} color={color} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 40, marginTop: 10 }}>
        {historyData && dataKey && (
          <ResponsiveContainer width="100%" height={40}>
            <LineChart data={historyData}>
              <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
              <Line type="monotone" dataKey={dataKey} stroke={color} strokeWidth={3} dot={false} style={{ filter: `drop-shadow(0px 4px 6px color-mix(in srgb, ${color} 40%, transparent))` }} />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

// 24h Operations Summary — time spent in each state
function OperationsSummary({ history }) {
  const counts = history.reduce((acc, h) => {
    const s = h.status ?? 'Healthy';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const total = history.length || 1;
  const states = [
    { label: 'Healthy', color: 'var(--green)', pct: Math.round(((counts.Healthy ?? 0) / total) * 100) },
    { label: 'Warning', color: 'var(--amber)', pct: Math.round(((counts.Warning ?? 0) / total) * 100) },
    { label: 'Critical', color: 'var(--red)',   pct: Math.round(((counts.Critical ?? 0) / total) * 100) },
  ];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: 1 }}>Session State Distribution</div>
      <div style={{ display: 'flex', height: 14, borderRadius: 99, overflow: 'hidden', gap: 2 }}>
        {states.map(s => s.pct > 0 && (
          <div key={s.label} style={{ flex: s.pct, background: s.color, transition: 'flex 0.5s ease' }} title={`${s.label}: ${s.pct}%`} />
        ))}
      </div>
      <div style={{ display: 'flex', gap: 16, marginTop: 4 }}>
        {states.map(s => (
          <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color }} />
            <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 600 }}>{s.label} <span style={{ color: s.color, fontWeight: 800 }}>{s.pct}%</span></span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Notification-style alert feed
function AlertFeed({ faults }) {
  const icons = { Critical: AlertTriangle, Warning: Zap, Healthy: CheckCircle };
  const colors = { Critical: 'var(--red)', Warning: 'var(--amber)', Healthy: 'var(--green)' };
  const recent = faults.slice(0, 8);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {recent.length === 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 16, background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
          <CheckCircle size={18} color="var(--green)" />
          <span style={{ fontSize: 13, color: 'var(--text-3)', fontWeight: 600 }}>No recent fault events — system nominal.</span>
        </div>
      )}
      {recent.map((f, i) => {
        const Icon = icons[f.severity] ?? AlertTriangle;
        const color = colors[f.severity] ?? 'var(--text-3)';
        return (
          <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
            style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, border: `1px solid var(--border)`, borderLeft: `3px solid ${color}` }}>
            <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.faultType}</div>
              <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 2 }}>{f.actionTaken}</div>
            </div>
            <span style={{ fontSize: 10, color: 'var(--text-4)', flexShrink: 0, fontFamily: 'var(--mono)' }}>
              {new Date(f.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

// Battery Cell visualization component (Ported from Mobile)
function BatteryCell({ index, voltage, active }) {
  const MIN_V = 2.8;
  const MAX_V = 4.2;
  const fillPct = active && voltage ? Math.max(0, Math.min(100, ((voltage - MIN_V) / (MAX_V - MIN_V)) * 100)) : 0;
  const healthColor = !active ? 'var(--border)' : (voltage < 3.0 || voltage > 4.15) ? 'var(--red)' : (voltage < 3.2 || voltage > 4.1) ? 'var(--amber)' : 'var(--green)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '22%' }}>
      <div style={{ width: 24, height: 6, background: active ? 'var(--border)' : 'var(--surface-3)', borderRadius: '3px 3px 0 0' }} />
      <div style={{ 
        width: '100%', height: 110, borderRadius: 6, border: `2px solid ${active ? 'var(--border)' : 'var(--surface-3)'}`,
        display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden', background: 'var(--surface-2)', position: 'relative'
      }}>
        <div style={{ width: '100%', height: `${fillPct}%`, background: healthColor, transition: 'height 1s ease, background 1s ease' }} />
        <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.2)' }}>
          <span style={{ fontSize: 14, fontWeight: 900, color: active ? '#fff' : 'var(--text-4)' }}>C{index}</span>
          <span style={{ fontSize: 11, fontWeight: 700, color: active ? '#fff' : 'var(--text-4)' }}>
            {active && voltage ? voltage.toFixed(2) : '0.00'}<span style={{ fontSize: 9 }}>V</span>
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard({ data, history }) {
  const [faults, setFaults] = useState([]);

  useEffect(() => {
    fetch('/api/faults').then(r => r.json()).then(d => d.success && setFaults(d.data)).catch(() => {});
    const t = setInterval(() => {
      fetch('/api/faults').then(r => r.json()).then(d => d.success && setFaults(d.data)).catch(() => {});
    }, 10000);
    return () => clearInterval(t);
  }, []);

  const statusColor = data?.status === 'Healthy' ? 'var(--green)' : data?.status === 'Warning' ? 'var(--amber)' : 'var(--red)';
  const sparkData = history.slice(-30).map(h => ({ health: h.batteryHealth, voltage: (h.cell1 + h.cell2 + h.cell3 + h.cell4), temp: Math.max(h.temp1 ?? 0, h.temp2 ?? 0), ai: h.anomalyScore }));

  // Predictive Analytics
  const currentLoad = data?.current ?? 0;
  const currentSoc = data?.soc ?? 100;
  let tteText = '--';
  let tteLabel = 'Predictive TTE';
  
  if (Math.abs(currentLoad) < 0.1) {
    tteText = 'N/A (Idle)';
    tteLabel = 'Time Remaining';
  } else if (currentLoad < 0) { // Discharging
    const hoursToEmpty = (currentSoc / 100) * (100 / Math.abs(currentLoad)); // 100Ah pack assumption
    tteText = `${hoursToEmpty.toFixed(1)} hrs`;
    tteLabel = 'Time to Empty (TTE)';
  } else { // Charging
    const hoursToFull = ((100 - currentSoc) / 100) * (100 / currentLoad);
    tteText = `${hoursToFull.toFixed(1)} hrs`;
    tteLabel = 'Time to Full (TTF)';
  }

  const peakTemp = history.reduce((max, h) => Math.max(max, h.temp1 ?? 0, h.temp2 ?? 0), 0);
  const peakLoad = history.reduce((max, h) => Math.max(max, Math.abs(h.current ?? 0)), 0);

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SafetyBanner data={data} />

      <motion.div variants={cV} initial="hidden" animate="show" className="bento-grid">
        {/* KPI Panel Row 1 */}
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="Battery Health (SoH)" value={`${data?.soh?.toFixed(1) ?? '--'}%`} sub={`Active Cells: ${data?.activeCells ?? 4}/4`} color={statusColor} icon={Battery} historyData={sparkData} dataKey="health" />
        </div>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="State of Charge (SoC)" value={`${(data?.soc ?? 100).toFixed(1)}%`} sub={`Status: ${data?.chargeStatus ?? 'Idle'}`} icon={Activity} historyData={sparkData} dataKey="voltage" color="var(--blue)" />
        </div>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="Diagnostic (ML Op)" value={data?.mlOp ?? 'NORMAL'} sub={data?.spn ? `J1939: SPN ${data.spn} FMI ${data.fmi}` : 'No fault codes'} color={data?.spn ? 'var(--red)' : 'var(--purple)'} icon={Cpu} historyData={sparkData} dataKey="temp" />
        </div>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="Battery Score" value={`${(data?.batteryScore ?? 100.0).toFixed(1)}%`} sub={data?.status ?? 'Healthy'} color={statusColor} icon={Brain} historyData={sparkData} dataKey="ai" />
        </div>

        {/* Row 2: Main Charts */}
        <motion.div variants={iV} className="bento-col-5" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          <BatteryHealthCard data={data} history={history} style={{ flex: 1, width: '100%' }} />
        </motion.div>
        <motion.div variants={iV} className="bento-col-4" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          <AIStatusCard data={data} history={history} style={{ flex: 1, width: '100%' }} />
        </motion.div>
        <motion.div variants={iV} className="bento-col-3" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          <ProtectionStatus data={data} style={{ flex: 1, width: '100%' }} />
        </motion.div>

        {/* Row 3: Operations Summary + Alert Feed + Cell Diagnostics */}
        <motion.div variants={iV} className="bento-col-4" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Clock size={15} color="var(--yellow)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Operations Summary</span>
              </div>
              <span className="badge badge-yellow"><Radio size={10} /> LIVE SESSION</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <OperationsSummary history={history} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { label: 'Packets Received', val: history.length, color: 'var(--blue)' },
                  { label: 'Relay State', val: data?.relay === 'CONNECTED' ? 'CLOSED' : 'OPEN', color: data?.relay === 'CONNECTED' ? 'var(--green)' : 'var(--red)' },
                  { label: 'Current Load', val: `${(data?.current ?? 0).toFixed(2)} A`, color: 'var(--text-2)' },
                  { label: 'Pack SoC', val: `${data?.soc ?? Math.round(((Math.max(data?.cell1??0,data?.cell2??0,data?.cell3??0,data?.cell4??0)-3.0)/(4.12-3.0))*100) ?? '--'}%`, color: 'var(--yellow)' },
                  { label: tteLabel, val: tteText, color: currentLoad > 0.1 ? 'var(--green)' : currentLoad < -0.1 ? 'var(--amber)' : 'var(--text-3)' },
                  { label: 'Peak Temp', val: `${peakTemp.toFixed(1)} °C`, color: peakTemp > 45 ? 'var(--red)' : peakTemp > 35 ? 'var(--amber)' : 'var(--green)' },
                ].map(({ label, val, color }) => (
                  <div key={label} style={{ background: 'var(--surface-2)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1 }}>{label}</div>
                    <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--mono)', marginTop: 4 }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div variants={iV} className="bento-col-4" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Battery size={15} color="var(--blue)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Cell Diagnostics</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', height: '100%', padding: '24px 20px' }}>
              {[1, 2, 3, 4].map(i => (
                <BatteryCell 
                  key={i} 
                  index={i} 
                  voltage={data?.[`cell${i}`]} 
                  active={(data?.activeCells ?? 4) >= i} 
                />
              ))}
            </div>
          </div>
        </motion.div>

        <motion.div variants={iV} className="bento-col-4" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 0 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} color="var(--amber)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Live Alert Feed</span>
              </div>
              <span className="badge badge-gray">{faults.length} events</span>
            </div>
            <div className="card-body" style={{ overflowY: 'auto', maxHeight: 320 }}>
              <AlertFeed faults={faults} />
            </div>
          </div>
        </motion.div>

      </motion.div>
    </motion.div>
  );
}
