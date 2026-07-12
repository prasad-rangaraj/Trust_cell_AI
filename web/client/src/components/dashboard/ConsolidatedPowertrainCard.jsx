import { motion } from 'framer-motion';
import { Zap, Activity, Navigation, ArrowUpRight, ArrowDownRight, Battery, Server } from 'lucide-react';

function BatteryCell({ index, voltage, active }) {
  const v = voltage ?? 3.6;
  const pct = Math.max(0, Math.min(100, ((v - 3.0) / (4.2 - 3.0)) * 100));
  let color = 'var(--green)';
  if (v > 4.1) color = 'var(--blue)';
  if (v < 3.2) color = 'var(--red)';
  if (!active) color = 'var(--text-4)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
      <div style={{ position: 'relative', width: 32, height: 70, border: '2px solid var(--border-2)', borderRadius: 6, background: 'var(--surface-3)', overflow: 'hidden', opacity: active ? 1 : 0.4 }}>
        <div style={{ position: 'absolute', bottom: 0, width: '100%', height: `${pct}%`, background: color, transition: 'height 0.3s ease' }} />
      </div>
      <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)' }}>CELL {index}</div>
      <div style={{ fontSize: 11, fontWeight: 800, fontFamily: 'var(--mono)', color: active ? 'var(--text-2)' : 'var(--text-4)' }}>{active ? `${v.toFixed(2)}v` : 'OFF'}</div>
    </div>
  );
}

export default function ConsolidatedPowertrainCard({ data, history }) {
  // Powertrain Math
  const packVoltage = (data?.cell1 ?? 4.1) + (data?.cell2 ?? 4.1) + (data?.cell3 ?? 4.1) + (data?.cell4 ?? 4.1);
  const current = data?.current ?? 0;
  const powerW = packVoltage * current;
  const powerKW = Math.abs(powerW / 1000).toFixed(2);
  
  let driveState = 'IDLE';
  let stateColor = 'var(--text-3)';
  let StateIcon = Activity;
  
  if (current > 0.5) {
    driveState = 'REGEN BRAKING';
    stateColor = 'var(--green)';
    StateIcon = ArrowDownRight;
  } else if (current < -0.5) {
    driveState = 'ACCELERATING';
    stateColor = 'var(--blue)';
    StateIcon = ArrowUpRight;
  }

  const soc = data?.soc ?? 100;
  const estimatedRangeKm = ((soc / 100) * 50000 / 150).toFixed(0);

  // Operations Math
  const peakTemp = history?.reduce((max, h) => Math.max(max, h.temp1 ?? 0, h.temp2 ?? 0), 0) ?? 0;
  const isRelayClosed = data?.relay === 'CONNECTED';

  return (
    <motion.div className="card animate-in" style={{ display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color="var(--yellow)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Powertrain & Hardware Telemetry</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, fontWeight: 700, color: 'var(--text-4)', letterSpacing: 1 }}>
          <Server size={12} /> {(data?.exec_time_us ?? 720)}µs CYCLE TIME
        </div>
      </div>
      
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: 32, padding: 24 }}>
        
        {/* Column 1: Core Powertrain */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ background: 'var(--surface-2)', padding: '16px', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 700, letterSpacing: 1, marginBottom: 8 }}>INSTANT POWER</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 40, fontWeight: 900, fontFamily: 'var(--mono)', color: 'var(--text)', lineHeight: 1 }}>{powerKW}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)' }}>kW</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: stateColor, fontWeight: 800, fontSize: 11, marginTop: 8 }}>
              <StateIcon size={14} /> {driveState}
            </div>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--surface-3)', padding: '12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>EST. RANGE</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{estimatedRangeKm} <span style={{ fontSize: 10 }}>km</span></div>
            </div>
            <div style={{ background: 'var(--surface-3)', padding: '12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>EFFICIENCY</div>
              <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--green)' }}>98.2 <span style={{ fontSize: 10 }}>%</span></div>
            </div>
          </div>
        </div>

        {/* Column 2: System Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1, marginBottom: 4 }}>SYSTEM OPERATIONS</div>
          {[
            { label: 'High Voltage Relay', val: isRelayClosed ? 'CLOSED' : 'OPEN', color: isRelayClosed ? 'var(--green)' : 'var(--red)' },
            { label: 'Peak Pack Temp', val: `${peakTemp.toFixed(1)} °C`, color: peakTemp > 45 ? 'var(--red)' : peakTemp > 35 ? 'var(--amber)' : 'var(--text-2)' },
            { label: 'Total Pack Voltage', val: `${packVoltage.toFixed(2)} V`, color: 'var(--text-2)' },
            { label: 'Active Load Current', val: `${current.toFixed(2)} A`, color: 'var(--text-2)' }
          ].map(op => (
            <div key={op.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'var(--surface-2)', borderRadius: 8, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)' }}>{op.label}</span>
              <span style={{ fontSize: 13, fontWeight: 800, fontFamily: 'var(--mono)', color: op.color }}>{op.val}</span>
            </div>
          ))}
        </div>

        {/* Column 3: Cell Diagnostics */}
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1, marginBottom: 16 }}>CELL VOLTAGE BALANCE</div>
          <div style={{ flex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface-2)', padding: '20px', borderRadius: 12, border: '1px solid var(--border)' }}>
             {[1, 2, 3, 4].map(i => (
                <BatteryCell key={i} index={i} voltage={data?.[`cell${i}`]} active={(data?.activeCells ?? 4) >= i} />
              ))}
          </div>
        </div>

      </div>
    </motion.div>
  );
}
