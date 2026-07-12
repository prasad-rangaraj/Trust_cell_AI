import { motion } from 'framer-motion';
import { Compass, Move, AlertOctagon } from 'lucide-react';

export default function VehicleDynamicsCard({ data }) {
  const ax = data?.imu?.ax ?? 0.02;
  const ay = data?.imu?.ay ?? -0.01;
  const vibration = data?.imu?.vibration ?? 0.05;

  // Calculate total G-Force (simplified 2D)
  const gForce = Math.sqrt(ax * ax + ay * ay).toFixed(2);
  
  // Pitch and Roll based on Gyro or derived from gravity vector
  // Mocking simple angles from acc
  const pitch = (ay * 90).toFixed(1); // Rough approximation for UI
  const roll = (ax * 90).toFixed(1);

  // Impact Warning Threshold
  const isHighImpact = vibration > 5.0 || gForce > 1.5;

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Compass size={16} color="var(--purple)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Vehicle Dynamics</span>
        </div>
        {isHighImpact && (
          <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <AlertOctagon size={10} /> HIGH IMPACT
          </span>
        )}
      </div>
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px', background: 'var(--surface-2)', borderRadius: 12, border: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, letterSpacing: 1, marginBottom: 4 }}>DYNAMIC G-FORCE</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
              <span style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--mono)', color: isHighImpact ? 'var(--red)' : 'var(--text)', lineHeight: 1 }}>{gForce}</span>
              <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)' }}>G</span>
            </div>
          </div>
          <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'var(--surface-3)', border: '2px solid var(--border)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ position: 'absolute', width: '100%', height: 1, background: 'var(--border-2)' }} />
            <div style={{ position: 'absolute', height: '100%', width: 1, background: 'var(--border-2)' }} />
            <motion.div 
              animate={{ x: ax * 20, y: ay * -20 }}
              transition={{ type: 'spring', stiffness: 100, damping: 10 }}
              style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--purple)', zIndex: 2 }}
            />
          </div>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, flex: 1 }}>
          <div style={{ background: 'var(--surface-3)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, marginBottom: 6 }}>PITCH (LONGITUDINAL)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Move size={14} color="var(--text-3)" style={{ transform: 'rotate(90deg)' }} />
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{pitch}°</span>
            </div>
          </div>
          <div style={{ background: 'var(--surface-3)', padding: '12px 16px', borderRadius: 12, border: '1px solid var(--border)' }}>
            <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, marginBottom: 6 }}>ROLL (LATERAL)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Move size={14} color="var(--text-3)" />
              <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{roll}°</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
