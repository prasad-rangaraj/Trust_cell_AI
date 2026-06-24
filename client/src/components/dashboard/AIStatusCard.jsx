import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity } from 'lucide-react';
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
          {score?.toFixed(1)}%
        </motion.span>
        <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>Score</span>
      </div>
    </div>
  );
}

const STATUS_CFG = {
  Healthy: { label: '✓ Healthy',           color: 'var(--green)', bg: 'var(--green-bg)',  border: 'var(--green-border)' },
  Warning: { label: '⚠ Anomaly Detected', color: 'var(--amber)', bg: 'var(--amber-bg)',  border: 'var(--amber-border)' },
  Critical:{ label: '✕ Critical Fault',   color: 'var(--red)',   bg: 'var(--red-bg)',    border: 'var(--red-border)' },
};

export default function AIStatusCard({ data, history }) {
  const cfg = STATUS_CFG[data?.status] || STATUS_CFG.Healthy;
  const chartData = history.map((h, i) => ({ i, v: h.anomalyScore ?? 0 }));

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
            <Brain size={14} color="var(--purple)" />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>TinyML Intelligence</div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>STM32 Edge AI · TFLite Micro</div>
          </div>
        </div>
        <span className="badge badge-purple">ACTIVE</span>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <AnomalyRing score={data?.anomalyScore ?? 0} />
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={data?.status}
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
              {data?.status === 'Healthy' ? 'All parameters in safe range' : 'Unusual pattern identified'}
            </div>
          </motion.div>
        </AnimatePresence>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Model', value: 'TFLite Micro' },
            { label: 'Latency', value: '< 10ms' },
            { label: 'Features', value: '7 inputs' },
            { label: 'Update', value: '2s cycle' },
          ].map(({ label, value }) => (
            <div key={label} style={{ padding: '8px 10px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
              <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600 }}>{label}</div>
              <div style={{ fontSize: 12, fontFamily: 'var(--mono)', fontWeight: 600, color: 'var(--text-2)', marginTop: 2 }}>{value}</div>
            </div>
          ))}
        </div>

        {chartData.length > 3 && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 11, color: 'var(--text-3)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
              <Activity size={11} />
              Anomaly Score History
            </div>
            <div style={{ flex: 1, minHeight: 42 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="aiG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="var(--purple)" stopOpacity={0.15} />
                      <stop offset="95%" stopColor="var(--purple)" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                    formatter={(v) => [`${v?.toFixed(1)}%`, 'Anomaly']}
                    labelFormatter={() => ''}
                  />
                  <Area type="monotone" dataKey="v" stroke="var(--purple)" strokeWidth={1.5} fill="url(#aiG)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
