import { motion } from 'framer-motion';
import { Brain, ShieldAlert, ShieldCheck } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip, CartesianGrid, YAxis } from 'recharts';

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

export default function ConsolidatedHealthAICard({ data, history }) {
  // SOH Metrics
  const pct = data?.batteryHealth ?? 0;
  const healthColor = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
  
  // AI Interlock Logic
  const mlOp = data?.mlOp || 'NORMAL';
  const hasFault = data?.spn !== undefined || mlOp !== 'NORMAL';
  const riskScore = data?.aiPrediction?.risk_score ?? 10.0;
  const isInterlockActive = hasFault || riskScore > 80;
  const statusColor = isInterlockActive ? 'var(--red)' : 'var(--green)';

  // AI Risk Chart Data
  const chartData = history.map((h, i) => ({ i, risk: h.aiPrediction?.risk_score ?? 0 }));

  return (
    <motion.div className="card animate-in" style={{ display: 'flex', flexDirection: 'column' }} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.04 }}>
      <div className="card-header" style={{ borderBottomColor: isInterlockActive ? 'rgba(239,68,68,0.2)' : 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Brain size={16} color="var(--purple)" />
          <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>AI Diagnostics & Health Engine</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 20, background: isInterlockActive ? 'rgba(239,68,68,0.15)' : 'rgba(34,197,94,0.15)', color: statusColor, fontWeight: 700, fontSize: 11, letterSpacing: 1 }}>
          {isInterlockActive ? <ShieldAlert size={14} /> : <ShieldCheck size={14} />}
          {isInterlockActive ? 'SYSTEM LOCKOUT' : 'INTERLOCK CLEAR'}
        </div>
      </div>
      
      <div className="card-body" style={{ display: 'grid', gridTemplateColumns: 'auto 1fr 1fr', gap: 32, padding: 24, alignItems: 'center' }}>
        
        {/* Left: Circular SOH */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 160 }}>
          <CircularProgress pct={pct} color={healthColor} />
          <div style={{ marginTop: 12, textAlign: 'center' }}>
             <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>Prediction Model</div>
             <div style={{ fontSize: 10, color: 'var(--purple)', fontWeight: 800, letterSpacing: 1, marginTop: 4 }}>LSTM V2.4</div>
          </div>
        </div>

        {/* Center: AI Risk Tracker */}
        <div style={{ display: 'flex', flexDirection: 'column', height: 180, borderRight: '1px solid var(--border-2)', paddingRight: 32 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', letterSpacing: 1 }}>REAL-TIME RISK TRAJECTORY</span>
            <span style={{ fontSize: 16, fontWeight: 800, fontFamily: 'var(--mono)', color: statusColor }}>{riskScore.toFixed(1)}</span>
          </div>
          <div style={{ flex: 1, width: '100%', position: 'relative' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="riskG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={statusColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={statusColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-2)" vertical={false} />
                <YAxis hide domain={[0, 100]} />
                <Tooltip contentStyle={{ background: 'var(--surface-3)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11, color: 'var(--text)' }} labelFormatter={() => ''} />
                <Area type="basis" dataKey="risk" stroke={statusColor} strokeWidth={3} fill="url(#riskG)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right: Degradation & RUL */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
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
                  <motion.div initial={{ width: 0 }} animate={{ width: `${factor.val}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: factor.color }} />
                </div>
                <div style={{ width: 25, fontSize: 10, color: 'var(--text-2)', fontWeight: 700, textAlign: 'right' }}>{factor.val}%</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>EST. CYCLES LEFT</div>
              <div style={{ fontSize: 20, color: 'var(--text-2)', fontWeight: 800, fontFamily: 'var(--mono)' }}>{data?.aiPrediction?.rul_cycles ?? 700}</div>
            </div>
            <div style={{ background: 'var(--surface-2)', padding: '12px', borderRadius: 8, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 700, letterSpacing: 1, marginBottom: 4 }}>RUL CONFIDENCE</div>
              <div style={{ fontSize: 20, color: 'var(--text-2)', fontWeight: 800, fontFamily: 'var(--mono)' }}>{(data?.aiPrediction?.rul_confidence ?? 0.3).toFixed(2)}</div>
            </div>
          </div>
        </div>

      </div>
    </motion.div>
  );
}
