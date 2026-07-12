import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, ReferenceLine } from 'recharts';

const NORMAL_MIN = 3.7;
const NORMAL_MAX = 4.2;
const WARN_MIN = 3.6;

function CellCard({ label, voltage, history, index }) {
  const isImbalanced = voltage < WARN_MIN || voltage > NORMAL_MAX;
  const isWarning = !isImbalanced && voltage < NORMAL_MIN;
  const isNormal = !isImbalanced && !isWarning;

  const color = isImbalanced ? '#ef4444' : isWarning ? '#f59e0b' : '#22c55e';
  const bgColor = isImbalanced ? 'rgba(239,68,68,0.08)' : isWarning ? 'rgba(245,158,11,0.08)' : 'rgba(34,197,94,0.06)';
  const borderColor = isImbalanced ? 'rgba(239,68,68,0.35)' : isWarning ? 'rgba(245,158,11,0.25)' : 'rgba(34,197,94,0.2)';
  const statusLabel = isImbalanced ? 'Imbalanced' : isWarning ? 'Low' : 'Normal';

  // Fill percentage (3.0V = 0%, 4.2V = 100%)
  const fillPct = Math.max(0, Math.min(100, ((voltage - 3.0) / 1.2) * 100));

  const chartData = history.map((h, i) => ({
    i,
    v: h[`cell${index + 1}`] ?? 0,
  }));

  return (
    <motion.div
      key={`${label}-${isImbalanced}`}
      initial={{ opacity: 0.7, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl p-4 flex flex-col gap-3 relative overflow-hidden"
      style={{
        background: bgColor,
        border: `1.5px solid ${borderColor}`,
        boxShadow: isImbalanced ? `0 0 20px rgba(239,68,68,0.15)` : 'none',
        minHeight: 160,
      }}
    >
      {/* Imbalanced alert flash */}
      {isImbalanced && (
        <div
          className="absolute inset-0 pointer-events-none rounded-2xl"
          style={{
            background: 'rgba(239,68,68,0.04)',
            animation: 'pulse 2s ease-in-out infinite',
          }}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-black"
            style={{ background: `${color}20`, color, border: `1px solid ${color}30` }}
          >
            {label}
          </div>
          <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
            CELL {index + 1}
          </span>
        </div>
        <span
          className="text-[10px] font-bold px-2 py-0.5 rounded-full  tracking-wide"
          style={{ background: `${color}18`, color, border: `1px solid ${color}25` }}
        >
          {statusLabel}
        </span>
      </div>

      {/* Voltage */}
      <div className="flex items-baseline gap-1">
        <AnimatePresence mode="wait">
          <motion.span
            key={voltage?.toFixed(2)}
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="font-mono font-black"
            style={{ fontSize: 32, color, lineHeight: 1 }}
          >
            {voltage?.toFixed(2)}
          </motion.span>
        </AnimatePresence>
        <span className="text-base font-semibold" style={{ color: `${color}80` }}>V</span>
      </div>

      {/* Fill bar (vertical-style horizontal) */}
      <div className="w-full">
        <div
          className="w-full rounded-full overflow-hidden"
          style={{ height: 4, background: 'rgba(255,255,255,0.06)' }}
        >
          <motion.div
            animate={{ width: `${fillPct}%` }}
            transition={{ duration: 0.8 }}
            className="h-full rounded-full"
            style={{
              background: `linear-gradient(90deg, ${color}70, ${color})`,
              boxShadow: `0 0 6px ${color}60`,
            }}
          />
        </div>
        <div className="flex justify-between mt-1">
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>3.0V</span>
          <span style={{ fontSize: 9, color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>4.2V</span>
        </div>
      </div>

      {/* Mini sparkline */}
      {chartData.length > 3 && (
        <div style={{ height: 30 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`cGrad${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.4} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <ReferenceLine y={NORMAL_MIN} stroke="rgba(245,158,11,0.3)" strokeDasharray="3 3" />
              <Area
                type="monotone" dataKey="v"
                stroke={color} strokeWidth={1.5}
                fill={`url(#cGrad${index})`}
                dot={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

export default function CellVoltageGrid({ data, history }) {
  const cells = [
    { label: 'C1', voltage: data.cell1 },
    { label: 'C2', voltage: data.cell2 },
    { label: 'C3', voltage: data.cell3 },
    { label: 'C4', voltage: data.cell4 },
  ];

  const voltages = cells.map(c => c.voltage);
  const avgV = (voltages.reduce((a, b) => a + b, 0) / 4).toFixed(3);
  const spread = (Math.max(...voltages) - Math.min(...voltages)).toFixed(3);
  const packV = voltages.reduce((a, b) => a + b, 0).toFixed(2);

  return (
    <div className="glass-card p-5 flex flex-col gap-4 h-full">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            Cell Voltage Monitor
          </h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
            4S Lithium-ion Pack — Individual cell tracking
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Pack Voltage</div>
            <div className="font-mono font-bold text-base" style={{ color: '#f5c842' }}>{packV}V</div>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Spread</div>
            <div
              className="font-mono font-bold text-base"
              style={{ color: parseFloat(spread) > 0.15 ? 'var(--red)' : parseFloat(spread) > 0.08 ? 'var(--amber)' : 'var(--green)' }}
            >
              {spread}V
            </div>
          </div>
        </div>
      </div>

      {/* 4 cell cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        {cells.map((cell, i) => (
          <CellCard key={cell.label} {...cell} index={i} history={history} />
        ))}
      </div>

      {/* Summary row */}
      <div
        className="flex items-center gap-4 px-4 py-3 rounded-xl"
        style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
      >
        <div className="flex-1">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Average Cell</div>
          <div className="font-mono font-bold" style={{ color: 'var(--text-primary)' }}>{avgV}V</div>
        </div>
        <div className="flex-1">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Max Spread</div>
          <div
            className="font-mono font-bold"
            style={{ color: parseFloat(spread) > 0.15 ? 'var(--red)' : 'var(--green)' }}
          >
            {spread}V
          </div>
        </div>
        <div className="flex-1">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Balance Status</div>
          <div
            className="font-bold text-sm"
            style={{ color: parseFloat(spread) > 0.15 ? 'var(--red)' : 'var(--green)' }}
          >
            {parseFloat(spread) > 0.15 ? '⚠ Imbalanced' : '✓ Balanced'}
          </div>
        </div>
        <div className="flex-1 text-right">
          <div className="text-xs" style={{ color: 'var(--text-muted)' }}>Nominal Range</div>
          <div className="font-mono text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>3.7 – 4.2V</div>
        </div>
      </div>
    </div>
  );
}
