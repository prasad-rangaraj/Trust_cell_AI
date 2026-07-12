import { motion } from 'framer-motion';
import { BatteryFull, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

function BatteryVisual({ pct, color }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="relative rounded-lg overflow-hidden"
        style={{ width: 120, height: 44, background: 'rgba(255,255,255,0.04)', border: '1.5px solid rgba(255,255,255,0.1)' }}
      >
        <motion.div
          className="absolute inset-y-0 left-0"
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            background: `linear-gradient(90deg, ${color}cc, ${color})`,
            boxShadow: `4px 0 12px ${color}50`,
          }}
        />
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="font-mono text-sm font-bold" style={{ color: '#fff', textShadow: '0 0 8px rgba(0,0,0,0.8)' }}>
            {pct.toFixed(0)}%
          </span>
        </div>
      </div>
      {/* Battery nub */}
      <div
        className="rounded-sm"
        style={{ width: 6, height: 16, background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.1)' }}
      />
    </div>
  );
}

export default function BatteryHealthCard({ data, history }) {
  const pct = data.batteryHealth ?? 0;
  const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
  const label = pct >= 80 ? 'Healthy' : pct >= 60 ? 'Degraded' : 'Critical';
  const labelColor = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';

  const chartData = history.map((h, i) => ({ i, v: h.batteryHealth ?? 0 }));

  const prev = history.length >= 2 ? history[history.length - 2]?.batteryHealth : pct;
  const trending = pct >= (prev ?? pct) ? 'up' : 'down';

  return (
    <motion.div
      className="glass-card p-5 h-full flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 }}
      style={{
        boxShadow: pct >= 80 ? '0 0 30px rgba(34,197,94,0.12)' : pct >= 60 ? '0 0 30px rgba(245,158,11,0.15)' : '0 0 30px rgba(239,68,68,0.2)',
      }}
    >
      {/* Title */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BatteryFull size={18} color={color} />
          <span className="text-sm font-semibold" style={{ color: 'var(--text-secondary)' }}>Battery Health</span>
        </div>
        <span className={`badge ${pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-amber' : 'badge-red'}`}>
          <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: labelColor }} />
          {label}
        </span>
      </div>

      {/* Big number */}
      <div className="flex items-end gap-3">
        <motion.span
          key={Math.round(pct)}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="font-mono font-black"
          style={{ fontSize: 56, lineHeight: 1, color }}
        >
          {pct.toFixed(1)}
        </motion.span>
        <span className="text-2xl font-bold mb-2" style={{ color: `${color}99` }}>%</span>
        <div className="mb-2 ml-1">
          {trending === 'up'
            ? <TrendingUp size={18} color="var(--green)" />
            : <TrendingDown size={18} color="var(--red)" />
          }
        </div>
      </div>

      {/* Battery visual */}
      <BatteryVisual pct={pct} color={color} />

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-xs mb-1.5" style={{ color: 'var(--text-muted)' }}>
          <span>State of Health</span>
          <span className="font-mono font-semibold" style={{ color }}>{pct.toFixed(1)}%</span>
        </div>
        <div className="progress-track">
          <motion.div
            className="progress-fill"
            animate={{ width: `${pct}%` }}
            transition={{ duration: 1 }}
            style={{
              background: `linear-gradient(90deg, ${color}88, ${color})`,
              boxShadow: `0 0 8px ${color}60`,
            }}
          />
        </div>
      </div>

      {/* Sparkline */}
      {chartData.length > 3 && (
        <div style={{ height: 50 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id="bhGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={color} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Tooltip
                contentStyle={{ background: '#0d1526', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 8, fontSize: 11 }}
                formatter={(v) => [`${v?.toFixed(1)}%`, 'Health']}
                labelFormatter={() => ''}
              />
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={2} fill="url(#bhGrad)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}
