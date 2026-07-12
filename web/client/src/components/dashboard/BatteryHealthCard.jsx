import { motion } from 'framer-motion';
import { Battery } from 'lucide-react';

function CircularProgress({ pct, color }) {
  const radius = 54;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <div style={{ position: 'relative', width: 140, height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={radius} stroke="var(--surface-3)" strokeWidth="10" fill="none" />
        <motion.circle 
          cx="70" cy="70" r={radius} 
          stroke={color} strokeWidth="10" fill="none" 
          strokeDasharray={circumference} 
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset }}
          transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
        <motion.span 
          initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 }}
          style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--mono)', color, lineHeight: 1 }}>
          {pct.toFixed(1)}
        </motion.span>
        <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1, marginTop: 4 }}>SOH %</span>
      </div>
    </div>
  );
}

export default function BatteryHealthCard({ data }) {
  const pct   = data?.batteryHealth ?? 0;
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
  const label = pct >= 80 ? 'Healthy' : pct >= 60 ? 'Degraded' : 'Critical';
  const cls   = pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-amber' : 'badge-red';

  return (
    <motion.div
      className="card animate-in"
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.04 }}
    >
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Battery size={16} color={color} />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Battery Health Analysis</span>
        </div>
        <span className={`badge ${cls}`} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {label}
        </span>
      </div>
      <div className="card-body" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, padding: 24 }}>
        
        {/* Left: Main SOH Gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifySelf: 'center', alignSelf: 'center' }}>
          <CircularProgress pct={pct} color={color} />
        </div>

        {/* Right: Insights */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 16 }}>
          
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1, marginBottom: 12 }}>DEGRADATION FACTORS</div>
            {[
              { label: 'Cyclic Wear', val: 45, color: 'var(--blue)' },
              { label: 'Calendar Aging', val: 40, color: 'var(--purple)' },
              { label: 'Thermal Stress', val: 15, color: 'var(--amber)' }
            ].map(factor => (
              <div key={factor.label} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <div style={{ width: 85, fontSize: 10, color: 'var(--text-4)', fontWeight: 600 }}>{factor.label}</div>
                <div style={{ flex: 1, height: 6, background: 'var(--surface-3)', borderRadius: 3, overflow: 'hidden' }}>
                  <motion.div initial={{ width: 0 }} animate={{ width: `${factor.val}%` }} transition={{ duration: 1, delay: 0.2 }} style={{ height: '100%', background: factor.color }} />
                </div>
                <div style={{ width: 25, fontSize: 10, color: 'var(--text-2)', fontWeight: 700, textAlign: 'right' }}>{factor.val}%</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <div style={{ background: 'var(--surface-3)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, marginBottom: 4 }}>REMAINING CYCLES</div>
              <div style={{ fontSize: 16, color: 'var(--text-2)', fontWeight: 800, fontFamily: 'var(--mono)' }}>{data?.aiPrediction?.rul_cycles ?? 700}</div>
            </div>
            <div style={{ background: 'var(--surface-3)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, marginBottom: 4 }}>AI CONFIDENCE</div>
              <div style={{ fontSize: 16, color: 'var(--text-2)', fontWeight: 800, fontFamily: 'var(--mono)' }}>{(data?.aiPrediction?.rul_confidence ?? 0.3).toFixed(2)}</div>
            </div>
          </div>

        </div>

      </div>
    </motion.div>
  );
}
