import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Thermometer, Wind } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

// SVG Arc Gauge
function ArcGauge({ value, min, max, color, unit, size = 110 }) {
  const pct = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const r = (size / 2) * 0.75;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = 210;
  const endAngle = 330;
  const totalArc = startAngle + (360 - startAngle) + endAngle; // 300 degrees

  const polarToXY = (angle, radius) => {
    const rad = ((angle - 90) * Math.PI) / 180;
    return { x: cx + radius * Math.cos(rad), y: cy + radius * Math.sin(rad) };
  };

  const describeArc = (from, to) => {
    const start = polarToXY(from, r);
    const end = polarToXY(to, r);
    const largeArc = to - from > 180 ? 1 : 0;
    return `M ${start.x} ${start.y} A ${r} ${r} 0 ${largeArc} 1 ${end.x} ${end.y}`;
  };

  const arcStart = 120; // bottom-left
  const arcRange = 300;
  const arcEnd = arcStart + arcRange * pct;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {/* Track */}
      <path
        d={describeArc(120, 420)}
        fill="none"
        stroke="rgba(255,255,255,0.06)"
        strokeWidth={8}
        strokeLinecap="round"
      />
      {/* Value arc */}
      <motion.path
        d={describeArc(120, 120)}
        animate={{ d: describeArc(120, arcEnd > 120 ? arcEnd : 120.01) }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        fill="none"
        stroke={color}
        strokeWidth={8}
        strokeLinecap="round"
        style={{ filter: `drop-shadow(0 0 6px ${color}80)` }}
      />
      {/* Center text */}
      <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize={18} fontWeight="900" fontFamily="JetBrains Mono">
        {typeof value === 'number' ? value.toFixed(value > 100 ? 0 : 1) : value}
      </text>
      <text x={cx} y={cy + 14} textAnchor="middle" fill="rgba(148,163,184,0.8)" fontSize={9} fontWeight="600">
        {unit}
      </text>
    </svg>
  );
}

function SensorCard({ icon: Icon, label, value, unit, min, max, color, sub, history, histKey, thresholdWarning, thresholdCritical }) {
  const isWarn = value >= thresholdWarning && value < thresholdCritical;
  const isCrit = value >= thresholdCritical;
  const status = isCrit ? 'Critical' : isWarn ? 'Warning' : 'Normal';
  const statusColor = isCrit ? 'var(--red)' : isWarn ? 'var(--amber)' : 'var(--green)';

  const chartData = history.map((h, i) => ({ i, v: h[histKey] ?? 0 }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl p-4 flex flex-col gap-3"
      style={{
        background: isCrit
          ? 'rgba(239,68,68,0.08)'
          : isWarn
          ? 'rgba(245,158,11,0.07)'
          : 'rgba(255,255,255,0.03)',
        border: `1px solid ${isCrit ? 'rgba(239,68,68,0.3)' : isWarn ? 'rgba(245,158,11,0.2)' : 'rgba(255,255,255,0.06)'}`,
        transition: 'all 0.4s ease',
        boxShadow: isCrit ? '0 0 16px rgba(239,68,68,0.15)' : 'none',
      }}
    >
      {/* Label */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon size={15} color={statusColor} />
          <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>{label}</span>
        </div>
        <span
          className="text-[9px] font-bold px-2 py-0.5 rounded-full  tracking-wider"
          style={{ background: `${statusColor}15`, color: statusColor, border: `1px solid ${statusColor}25` }}
        >
          {status}
        </span>
      </div>

      {/* Gauge */}
      <div className="flex items-center justify-center">
        <ArcGauge value={value} min={min} max={max} color={statusColor} unit={unit} size={100} />
      </div>

      {/* Sub label */}
      <div className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>{sub}</div>

      {/* Sparkline */}
      {chartData.length > 3 && (
        <div style={{ height: 28 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`sg${histKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={statusColor} stopOpacity={0.3} />
                  <stop offset="95%" stopColor={statusColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={statusColor} strokeWidth={1.5} fill={`url(#sg${histKey})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </motion.div>
  );
}

export default function SensorPanel({ data, history }) {
  const gasLevel = data.gas > 500 ? 'HIGH' : data.gas > 250 ? 'ELEVATED' : 'NORMAL';
  const gasColor = data.gas > 500 ? 'var(--red)' : data.gas > 250 ? 'var(--amber)' : 'var(--green)';

  return (
    <div className="glass-card p-5 flex flex-col gap-4 h-full">
      <div>
        <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Sensor Monitoring</h2>
        <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>Current · Temperature · Gas Emission</p>
      </div>

      <SensorCard
        icon={Zap}
        label="Current"
        value={data.current ?? 0}
        unit="A"
        min={0} max={20}
        thresholdWarning={10} thresholdCritical={15}
        color="var(--blue)"
        sub="Load Current"
        history={history}
        histKey="current"
      />

      <SensorCard
        icon={Thermometer}
        label="Temperature"
        value={data.temperature ?? 0}
        unit="°C"
        min={0} max={100}
        thresholdWarning={55} thresholdCritical={65}
        color="var(--amber)"
        sub="Pack Temperature"
        history={history}
        histKey="temperature"
      />

      {/* Gas — special card with ppm + level */}
      <motion.div
        className="rounded-xl p-4 flex flex-col gap-2"
        style={{
          background: data.gas > 500 ? 'rgba(239,68,68,0.08)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${data.gas > 500 ? 'rgba(239,68,68,0.3)' : 'rgba(255,255,255,0.06)'}`,
          transition: 'all 0.4s',
        }}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Wind size={15} color={gasColor} />
            <span className="text-xs font-semibold" style={{ color: 'var(--text-secondary)' }}>Gas Emission</span>
          </div>
          <span
            className="text-[9px] font-bold px-2 py-0.5 rounded-full  tracking-wider animate-blink"
            style={{ background: `${gasColor}15`, color: gasColor, border: `1px solid ${gasColor}25` }}
          >
            {gasLevel}
          </span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <AnimatePresence mode="wait">
            <motion.span
              key={Math.round(data.gas)}
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="font-mono font-black text-3xl"
              style={{ color: gasColor }}
            >
              {Math.round(data.gas ?? 0)}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm font-semibold" style={{ color: `${gasColor}80` }}>ppm</span>
        </div>
        <div className="progress-track mt-1">
          <motion.div
            animate={{ width: `${Math.min(100, ((data.gas ?? 0) / 1000) * 100)}%` }}
            transition={{ duration: 0.8 }}
            className="progress-fill"
            style={{ background: `linear-gradient(90deg, ${gasColor}70, ${gasColor})`, boxShadow: `0 0 6px ${gasColor}60` }}
          />
        </div>
        <div className="flex justify-between text-[9px]" style={{ color: 'var(--text-muted)', fontFamily: 'JetBrains Mono' }}>
          <span>0 ppm</span>
          <span>500 ppm (Danger)</span>
          <span>1000 ppm</span>
        </div>
        <div className="text-xs" style={{ color: 'var(--text-muted)' }}>MQ135 Gas Sensor</div>
      </motion.div>
    </div>
  );
}
