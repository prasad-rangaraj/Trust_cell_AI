import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Activity, TrendingUp } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

// Animated SVG ring
function AnomalyRing({ score }) {
  const size = 140;
  const strokeWidth = 12;
  const r = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - score / 100);

  const color = score < 20 ? '#22c55e' : score < 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        {/* Track */}
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke="rgba(255,255,255,0.06)"
          strokeWidth={strokeWidth}
        />
        {/* Progress */}
        <motion.circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{ filter: `drop-shadow(0 0 8px ${color}80)` }}
        />
      </svg>
      {/* Center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-0.5">
        <motion.span
          key={Math.round(score)}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="font-mono font-black"
          style={{ fontSize: 28, color, lineHeight: 1 }}
        >
          {score?.toFixed(1)}%
        </motion.span>
        <span className="text-[9px] font-semibold tracking-widest " style={{ color: 'rgba(148,163,184,0.7)' }}>
          Score
        </span>
      </div>
    </div>
  );
}

const STATUS_CONFIG = {
  Healthy: {
    label: '✓ Healthy',
    sub: 'All parameters within safe range',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.08)',
    border: 'rgba(34,197,94,0.2)',
    dot: '#22c55e',
  },
  Warning: {
    label: '⚠ Anomaly Detected',
    sub: 'Unusual pattern identified by TinyML',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.25)',
    dot: '#f59e0b',
  },
  Critical: {
    label: '✕ Critical Fault',
    sub: 'Immediate battery protection activated',
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.3)',
    dot: '#ef4444',
  },
};

export default function AIStatusCard({ data, history }) {
  const cfg = STATUS_CONFIG[data.status] || STATUS_CONFIG.Healthy;
  const chartData = history.map((h, i) => ({ i, v: h.anomalyScore ?? 0 }));

  return (
    <motion.div
      className="glass-card p-5 h-full flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      style={{
        boxShadow: data.status !== 'Healthy' ? `0 0 30px ${cfg.color}25` : 'none',
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center"
            style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.2)' }}
          >
            <Brain size={16} color="#818cf8" />
          </div>
          <div>
            <div className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>TinyML Intelligence</div>
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>STM32 Edge AI</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <div
            className="w-2 h-2 rounded-full animate-pulse"
            style={{ background: '#818cf8' }}
          />
          <span className="text-xs font-semibold" style={{ color: '#818cf8' }}>ACTIVE</span>
        </div>
      </div>

      {/* Ring + Status */}
      <div className="flex flex-col items-center gap-3">
        <AnomalyRing score={data.anomalyScore ?? 0} />

        {/* Status badge */}
        <AnimatePresence mode="wait">
          <motion.div
            key={data.status}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="w-full text-center px-4 py-3 rounded-xl"
            style={{ background: cfg.bg, border: `1px solid ${cfg.border}` }}
          >
            <div className="flex items-center justify-center gap-2">
              <div
                className="w-2 h-2 rounded-full"
                style={{ background: cfg.dot, boxShadow: `0 0 6px ${cfg.dot}` }}
              />
              <span className="font-bold text-base" style={{ color: cfg.color }}>{cfg.label}</span>
            </div>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{cfg.sub}</p>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl px-3 py-2 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Model</div>
          <div className="font-mono text-xs font-bold mt-0.5" style={{ color: 'var(--text-secondary)' }}>TFLite Micro</div>
        </div>
        <div
          className="rounded-xl px-3 py-2 text-center"
          style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}
        >
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Latency</div>
          <div className="font-mono text-xs font-bold mt-0.5" style={{ color: 'var(--green)' }}>&lt; 10ms</div>
        </div>
      </div>

      {/* Anomaly chart */}
      {chartData.length > 3 && (
        <div>
          <div className="flex items-center gap-1 mb-2">
            <Activity size={12} color="var(--text-muted)" />
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>Anomaly Score History</span>
          </div>
          <div style={{ height: 52 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="aiGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`${v?.toFixed(1)}%`, 'Anomaly']}
                  labelFormatter={() => ''}
                />
                <Area type="monotone" dataKey="v" stroke="#818cf8" strokeWidth={2} fill="url(#aiGrad)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </motion.div>
  );
}
