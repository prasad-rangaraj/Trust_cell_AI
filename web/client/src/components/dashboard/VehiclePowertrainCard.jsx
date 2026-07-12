import { motion } from 'framer-motion';
import { Zap, Activity, Navigation, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function VehiclePowertrainCard({ data }) {
  // Derive Pack Voltage (4S pack -> roughly 16.8V)
  const packVoltage = (data?.cell1 ?? 4.1) + (data?.cell2 ?? 4.1) + (data?.cell3 ?? 4.1) + (data?.cell4 ?? 4.1);
  const current = data?.current ?? 0;
  
  // Power in Watts (Voltage * Current)
  const powerW = packVoltage * current;
  const powerKW = Math.abs(powerW / 1000).toFixed(2);
  
  // Determine Drive State
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

  // Estimated Range based on SoC and a mock efficiency (e.g., 150 Wh/km)
  const soc = data?.soc ?? 100;
  const mockPackCapacityWh = 50000; // 50 kWh
  const currentEnergyWh = (soc / 100) * mockPackCapacityWh;
  const estimatedRangeKm = (currentEnergyWh / 150).toFixed(0);

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Zap size={16} color="var(--blue)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Powertrain Dynamics</span>
        </div>
      </div>
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>INSTANT POWER</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--mono)', color: 'var(--text)', lineHeight: 1 }}>{powerKW}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)' }}>kW</span>
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>DRIVE STATE</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: stateColor, fontWeight: 800 }}>
              <StateIcon size={16} />
              {driveState}
            </div>
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
          <div style={{ background: 'var(--surface-3)', padding: '16px', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Navigation size={12} /> EST. RANGE
            </div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>
              {estimatedRangeKm} <span style={{ fontSize: 12, color: 'var(--text-4)' }}>km</span>
            </div>
          </div>
          <div style={{ background: 'var(--surface-3)', padding: '16px', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, marginBottom: 8 }}>PACK EFFICIENCY</div>
            <div style={{ fontSize: 24, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--green)' }}>
              98.2 <span style={{ fontSize: 12, color: 'var(--text-4)' }}>%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
