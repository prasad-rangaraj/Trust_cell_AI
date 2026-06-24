import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, ResponsiveContainer, YAxis } from 'recharts';
import SafetyBanner from '../components/dashboard/SafetyBanner';
import BatteryHealthCard from '../components/dashboard/BatteryHealthCard';
import CellVoltageGrid from '../components/dashboard/CellVoltageGrid';
import SensorPanel from '../components/dashboard/SensorPanel';
import AIStatusCard from '../components/dashboard/AIStatusCard';
import ProtectionStatus from '../components/dashboard/ProtectionStatus';
import EventLog from '../components/dashboard/EventLog';
import DemoPanel from '../components/dashboard/DemoPanel';
import { Activity, Battery, Cpu, Brain } from 'lucide-react';

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } }
};

function MiniStat({ label, value, sub, color = 'var(--text)', icon: Icon, historyData, dataKey }) {
  const isDanger = color === 'var(--red)' || color === 'var(--amber)';
  
  return (
    <motion.div 
      variants={itemVariants}
      className="bento-item" 
      style={{ padding: '20px', gap: '12px', justifyContent: 'space-between', borderTop: `2px solid ${color}` }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <span className="stat-label" style={{ color: 'var(--text-3)', letterSpacing: '0.05em' }}>{label}</span>
          <div className="stat-value" style={{ color: 'var(--text)', fontSize: 36, marginTop: '4px', textShadow: isDanger ? `0 0 12px color-mix(in srgb, ${color} 40%, transparent)` : 'none' }}>{value}</div>
          {sub && <div className="stat-sub" style={{ color: color !== 'var(--text)' ? color : 'var(--text-4)', fontWeight: 600, marginTop: '2px' }}>{sub}</div>}
        </div>
        {Icon && (
          <div style={{ 
            background: `color-mix(in srgb, ${color} 15%, transparent)`,
            padding: '10px', 
            borderRadius: '12px',
            boxShadow: `0 0 20px color-mix(in srgb, ${color} 20%, transparent)`
          }}>
            <Icon size={24} color={color} />
          </div>
        )}
      </div>
      <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end', minHeight: '40px', marginTop: '10px' }}>
        {historyData && dataKey && (
          <div style={{ width: '100%', height: '100%' }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={historyData}>
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} hide />
                <Line 
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={color} 
                  strokeWidth={3} 
                  dot={false} 
                  isAnimationActive={true}
                  style={{ filter: `drop-shadow(0px 4px 6px color-mix(in srgb, ${color} 40%, transparent))` }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default function Dashboard({ data, history }) {
  const [faults, setFaults] = useState([]);

  useEffect(() => {
    fetch('/api/faults').then(r => r.json()).then(d => d.success && setFaults(d.data)).catch(() => {});
  }, []);

  const onScenarioChange = () => {
    setTimeout(() => {
      fetch('/api/faults').then(r => r.json()).then(d => d.success && setFaults(d.data)).catch(() => {});
    }, 500);
  };

  const statusColor = data?.status === 'Healthy' ? 'var(--green)' : data?.status === 'Warning' ? 'var(--amber)' : 'var(--red)';

  // Format history for sparklines
  const sparkData = history.slice(-30).map(h => ({
    health: h.batteryHealth,
    voltage: (h.cell1 + h.cell2 + h.cell3 + h.cell4),
    temp: Math.max(h.temp1 ?? 0, h.temp2 ?? 0),
    ai: h.anomalyScore
  }));

  return (
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      transition={{ duration: 0.4 }}
      style={{ display: 'flex', flexDirection: 'column', gap: 24 }}
    >
      <SafetyBanner data={data} />

      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="bento-grid"
      >
        {/* Row 1: KPI Cards */}
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="Battery Health" value={`${data?.batteryHealth?.toFixed(1) ?? '--'}%`} sub="State of Health" color={statusColor} icon={Battery} historyData={sparkData} dataKey="health" />
        </div>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="Pack Voltage" value={`${((data?.cell1 ?? 4) + (data?.cell2 ?? 4) + (data?.cell3 ?? 4) + (data?.cell4 ?? 4)).toFixed(2)}V`} sub="4S Li-ion" icon={Activity} historyData={sparkData} dataKey="voltage" color="var(--blue)" />
        </div>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="Max Temp" value={`${Math.max(data?.temp1 ?? 0, data?.temp2 ?? 0).toFixed(1)}°C`} sub={Math.max(data?.temp1 ?? 0, data?.temp2 ?? 0) > 55 ? '⚠ High' : 'Normal'} color={Math.max(data?.temp1 ?? 0, data?.temp2 ?? 0) > 55 ? 'var(--amber)' : 'var(--purple)'} icon={Cpu} historyData={sparkData} dataKey="temp" />
        </div>
        <div className="bento-col-3" style={{ display: 'flex', flexDirection: 'column' }}>
          <MiniStat label="AI Score" value={`${data?.anomalyScore?.toFixed(1) ?? '--'}%`} sub={data?.status ?? 'Healthy'} color={statusColor} icon={Brain} historyData={sparkData} dataKey="ai" />
        </div>

        {/* Row 2: Main metrics */}
        <motion.div variants={itemVariants} className="bento-col-5" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          <BatteryHealthCard data={data} history={history} style={{ flex: 1, width: '100%' }} />
        </motion.div>
        <motion.div variants={itemVariants} className="bento-col-4" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          <AIStatusCard data={data} history={history} style={{ flex: 1, width: '100%' }} />
        </motion.div>
        <motion.div variants={itemVariants} className="bento-col-3" style={{ display: 'flex', flexDirection: 'column', minHeight: 420 }}>
          <ProtectionStatus data={data} style={{ flex: 1, width: '100%' }} />
        </motion.div>

        {/* Row 3: Cells */}
        <motion.div variants={itemVariants} className="bento-col-12" style={{ display: 'flex', flexDirection: 'column' }}>
          <CellVoltageGrid data={data} history={history} style={{ flex: 1, width: '100%' }} />
        </motion.div>

        {/* Row 4: Sensors */}
        <motion.div variants={itemVariants} className="bento-col-12" style={{ display: 'flex', flexDirection: 'column' }}>
          <SensorPanel data={data} history={history} style={{ flex: 1, width: '100%' }} />
        </motion.div>

        {/* Row 4: Logs & Demo */}
        <motion.div variants={itemVariants} className="bento-col-8" style={{ display: 'flex', flexDirection: 'column', minHeight: 340 }}>
          <EventLog faults={faults} data={data} style={{ flex: 1, width: '100%' }} />
        </motion.div>
        <motion.div variants={itemVariants} className="bento-col-4" style={{ display: 'flex', flexDirection: 'column', minHeight: 340 }}>
          <DemoPanel onScenarioChange={onScenarioChange} style={{ flex: 1, width: '100%' }} />
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
