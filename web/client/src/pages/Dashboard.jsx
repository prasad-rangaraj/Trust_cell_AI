import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Battery, Cpu, Brain, AlertTriangle } from 'lucide-react';
import SafetyBanner from '../components/dashboard/SafetyBanner';
import ConsolidatedHealthAICard from '../components/dashboard/ConsolidatedHealthAICard';
import ConsolidatedPowertrainCard from '../components/dashboard/ConsolidatedPowertrainCard';
import VehicleDynamicsCard from '../components/dashboard/VehicleDynamicsCard';

const iV = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0, transition: { type: 'spring', stiffness: 300, damping: 24 } } };
const cV = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };

function AlertFeed({ faults }) {
  if (!faults || faults.length === 0) return <div style={{ color: 'var(--text-4)', fontSize: 12, padding: 20, textAlign: 'center' }}>No active alerts.</div>;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {faults.map((f, i) => (
        <div key={i} style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, borderLeft: `3px solid var(--amber)` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{f.message || 'System Alert'}</div>
          <div style={{ fontSize: 10, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{new Date(f.timestamp || Date.now()).toLocaleTimeString()}</div>
        </div>
      ))}
    </div>
  );
}

function MiniStat({ label, value, sub, color = 'var(--text)', icon: Icon }) {
  const isDanger = color === 'var(--red)' || color === 'var(--amber)';
  const isTextValue = typeof value === 'string' && /^[a-zA-Z]+$/.test(value.trim());

  return (
    <motion.div variants={iV} className="bento-item" style={{ padding: 24, gap: 12, justifyContent: 'space-between' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span className="stat-label" style={{ color: 'var(--text-3)', letterSpacing: '0.05em' }}>{label}</span>
          <div className="stat-value" style={{ 
            color: 'var(--text)', 
            fontSize: isTextValue ? 28 : 36, 
            marginTop: 4, 
            fontFamily: isTextValue ? 'Inter, sans-serif' : 'var(--mono)',
            fontWeight: isTextValue ? 700 : 800,
            letterSpacing: isTextValue ? '-0.02em' : 'normal',
            textShadow: isDanger ? `0 0 12px color-mix(in srgb, ${color} 40%, transparent)` : 'none' 
          }}>
            {isTextValue ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value}
          </div>
          <div className="stat-sub" style={{ color: 'var(--text-4)', fontSize: 11, marginTop: 8 }}>{sub}</div>
        </div>
        <div style={{ width: 44, height: 44, borderRadius: 12, background: `color-mix(in srgb, ${color} 15%, transparent)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={22} color={color} />
        </div>
      </div>
    </motion.div>
  );
}

export default function Dashboard({ data, history: globalHistory }) {
  const [faults, setFaults] = useState([]);
  const [mockHistory, setMockHistory] = useState([]);

  useEffect(() => {
    const initialHistory = Array.from({ length: 50 }, (_, i) => ({
      batteryHealth: 100,
      temp1: 30 + Math.sin(i / 5) * 5,
      temp2: 32 + Math.cos(i / 5) * 5,
      current: Math.random() > 0.8 ? -2.5 : 1.2,
      aiPrediction: { risk_score: 10 + Math.sin(i / 8) * 4 + Math.random() * 0.5 }
    }));
    setMockHistory(initialHistory);

    const ws = new WebSocket('ws://localhost:3001/ws/telemetry');
    ws.onmessage = (event) => {
      const parsed = JSON.parse(event.data);
      if (parsed.type === 'fault_feed') {
        setFaults(parsed.data);
      }
    };
    return () => ws.close();
  }, []);

  const history = globalHistory && globalHistory.length > 0 ? globalHistory : mockHistory;


  const statusColor = data?.status === 'CRITICAL' ? 'var(--red)' : data?.status === 'WARNING' ? 'var(--amber)' : 'var(--green)';

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SafetyBanner data={data} />

      {/* Top Strip: Quick KPIs */}
      <motion.div variants={cV} initial="hidden" animate="show" className="bento-grid" style={{ marginBottom: 8 }}>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="Battery Health (SoH)" value={`${data?.soh?.toFixed(1) ?? '--'}%`} sub={`Active Cells: ${data?.activeCells ?? 4}/4`} color={statusColor} icon={Battery} />
        </div>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="State of Charge (SoC)" value={`${(data?.soc ?? 100).toFixed(1)}%`} sub={`Status: ${data?.chargeStatus ?? 'Idle'}`} icon={Activity} color="var(--blue)" />
        </div>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="Diagnostic (ML Op)" value={data?.mlOp ?? 'NORMAL'} sub={data?.spn ? `J1939: SPN ${data.spn} FMI ${data.fmi}` : 'No fault codes'} color={data?.spn ? 'var(--red)' : 'var(--purple)'} icon={Cpu} />
        </div>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="Battery Score" value={`${(data?.batteryScore ?? 100.0).toFixed(1)}%`} sub={data?.status ?? 'Healthy'} color={statusColor} icon={Brain} />
        </div>
      </motion.div>

      {/* Macro Layout: 2 Columns */}
      <div style={{ display: 'grid', gridTemplateColumns: '7.5fr 4.5fr', gap: 24 }}>
        
        {/* Left Column: Core Engine */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <ConsolidatedHealthAICard data={data} history={history} />
          <ConsolidatedPowertrainCard data={data} history={history} />
        </div>

        {/* Right Column: Context & Environment */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          <VehicleDynamicsCard data={data} />
          
          {/* Alert Feed Card */}
          <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 300 }}>
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={15} color="var(--amber)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Live Alert Feed</span>
              </div>
              <span className="badge badge-gray">{faults.length} events</span>
            </div>
            <div className="card-body" style={{ overflowY: 'auto', maxHeight: 400 }}>
              <AlertFeed faults={faults} />
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
