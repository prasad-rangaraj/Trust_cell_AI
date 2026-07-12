import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, ShieldAlert } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

function AnomalyRing({ score }) {
  const size = 120;
  const stroke = 10;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, score / 100));
  const offset = circ * (1 - pct);
  const color = score < 20 ? 'var(--green)' : score < 50 ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="var(--surface-3)" strokeWidth={stroke} />
        <motion.circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circ}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <motion.span
          key={Math.round(score)}
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          style={{ fontSize: 22, fontWeight: 900, fontFamily: 'var(--mono)', color, lineHeight: 1 }}
        >
          {score?.toFixed(1)}
        </motion.span>
        <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600, letterSpacing: '0.06em', }}>Risk</span>
      </div>
    </div>
  );
}

const STATUS_CFG = {
  NORMAL: { label: '✓ System Normal', color: 'var(--green)', bg: 'var(--green-bg)', border: 'var(--green-border)', desc: 'LSTM monitoring active' },
  OVERTEMPERATURE: { label: '✕ Thermal Fault', color: 'var(--red)', bg: 'var(--red-bg)', border: 'var(--red-border)', desc: 'Chemical hazard predicted' },
  SENSOR_FAULT: { label: '⚠ Sensor Override', color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)', desc: 'Trust Engine mitigated data' },
};

export default function AIStatusCard({ data, history }) {
  const prediction = data?.aiPrediction?.prediction || 'NORMAL';
  const cfg = STATUS_CFG[prediction] || STATUS_CFG.NORMAL;
  
  // Use risk_score if available, fallback to anomalyScore
  const riskScore = data?.aiPrediction?.risk_score ?? (data?.anomalyScore ?? 0);
  const chartData = history.map((h, i) => ({ i, v: h.aiPrediction?.risk_score ?? (h.anomalyScore ?? 0) }));

  return (
    <motion.div
      className="card animate-in"
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 }}
    >
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ width: 28, height: 28, borderRadius: 8, background: 'var(--purple-bg)', border: '1px solid var(--purple-border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {prediction === 'SENSOR_FAULT' ? <ShieldAlert size={14} color="var(--amber)" /> : <Brain size={14} color="var(--purple)" />}
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>{prediction === 'SENSOR_FAULT' ? 'Sensor Trust Engine' : 'LSTM AI Inference'}</div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>STM32 Edge AI · TFLite Micro</div>
          </div>
        </div>
        <span className={`badge ${prediction === 'SENSOR_FAULT' ? 'badge-yellow' : 'badge-purple'}`}>ACTIVE</span>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AnomalyRing score={riskScore} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={prediction}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              padding: '10px 14px', borderRadius: 8,
              background: cfg.bg, border: `1px solid ${cfg.border}`,
              textAlign: 'center',
            }}
          >
            <div style={{ fontWeight: 700, fontSize: 14, color: cfg.color }}>{cfg.label}</div>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2 }}>
              {cfg.desc}
            </div>
          </motion.div>
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'SOH Conf', value: `${(data?.aiPrediction?.soh_confidence ?? 0.3).toFixed(2)}` },
            { label: 'RUL Conf', value: `${(data?.aiPrediction?.rul_confidence ?? 0.3).toFixed(2)}` },
            { label: 'Source', value: data?.aiPrediction?.source?.includes('Trust') ? 'Trust Engine' : 'LSTM' },
            { label: 'State', value: prediction },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--surface-3)', padding: '6px 8px', borderRadius: 6, border: '1px solid var(--border)' }}>
              <div style={{ fontSize: 9, color: 'var(--text-4)' }}>{m.label}</div>
              <div style={{ fontSize: 11, color: 'var(--text-2)', fontWeight: 700, marginTop: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.value}</div>
            </div>
          ))}
        </div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginTop: 10 }}>
          <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
            <Activity size={11} />
            Risk Score History
          </div>
          <div style={{ flex: 1, minHeight: 42 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="aiG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={cfg.color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={cfg.color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`${v?.toFixed(1)}`, 'Risk Score']}
                  labelFormatter={() => ''}
                />
                <Area type="monotone" dataKey="v" stroke={cfg.color} strokeWidth={1.5} fill="url(#aiG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
