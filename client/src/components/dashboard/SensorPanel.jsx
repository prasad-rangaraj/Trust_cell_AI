import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Thermometer, Wind, Activity } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

function ArcGauge({ value, min, max, color, unit, size = 96 }) {
  const pct    = Math.max(0, Math.min(1, (value - min) / (max - min)));
  const sw     = 9;
  const r      = (size - sw) / 2;
  const cx     = size / 2;
  const cy     = size / 2;
  const arc    = 270; // degrees
  const startA = 135;

  const polarXY = (angle, rad) => ({
    x: cx + rad * Math.cos(((angle - 90) * Math.PI) / 180),
    y: cy + rad * Math.sin(((angle - 90) * Math.PI) / 180),
  });

  const describeArc = (from, to) => {
    const s = polarXY(from, r);
    const e = polarXY(to, r);
    const la = to - from > 180 ? 1 : 0;
    return `M ${s.x} ${s.y} A ${r} ${r} 0 ${la} 1 ${e.x} ${e.y}`;
  };

  const endAngle = startA + arc * pct;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <path d={describeArc(startA, startA + arc)} fill="none" stroke="var(--surface-3)" strokeWidth={sw} strokeLinecap="round" />
      <motion.path
        d={describeArc(startA, startA)}
        animate={{ d: describeArc(startA, endAngle > startA ? endAngle : startA + 0.01) }}
        transition={{ duration: 1, ease: 'easeInOut' }}
        fill="none" stroke={color} strokeWidth={sw} strokeLinecap="round"
      />
      <text x={cx} y={cy - 2} textAnchor="middle" fill={color} fontSize={16} fontWeight="900" fontFamily="'JetBrains Mono', monospace">
        {typeof value === 'number' ? value.toFixed(value < 10 ? 2 : value > 100 ? 0 : 1) : value}
      </text>
      <text x={cx} y={cy + 12} textAnchor="middle" fill="var(--text-4)" fontSize={9} fontWeight="600">{unit}</text>
    </svg>
  );
}

function SensorCard({ icon: Icon, label, value, unit, min, max, color, sub, history, histKey, warnAt, critAt }) {
  const isWarn = value >= warnAt && value < critAt;
  const isCrit = value >= critAt;
  const sc     = isCrit ? 'var(--red)' : isWarn ? 'var(--amber)' : color;
  const status = isCrit ? 'Critical' : isWarn ? 'Warning' : 'Normal';
  const cls    = isCrit ? 'badge-red' : isWarn ? 'badge-amber' : 'badge-green';

  const chartData = history.map((h, i) => ({ i, v: h[histKey] ?? 0 }));

  return (
    <div style={{
      padding: 14, borderRadius: 10,
      background: isCrit ? 'var(--red-bg)' : isWarn ? 'var(--amber-bg)' : 'var(--surface)',
      border: `1px solid ${isCrit ? 'var(--red-border)' : isWarn ? 'var(--amber-border)' : 'var(--border)'}`,
      boxShadow: 'var(--shadow-xs)',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'all 0.4s',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Icon size={14} color={sc} />
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>{label}</span>
        </div>
        <span className={`badge ${cls}`} style={{ fontSize: 9 }}>{status}</span>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <ArcGauge value={value} min={min} max={max} color={sc} unit={unit} size={90} />
      </div>
      <div style={{ fontSize: 10, textAlign: 'center', color: 'var(--text-4)' }}>{sub}</div>
      {chartData.length > 3 && (
        <div style={{ height: 24 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`sG${histKey}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={sc} stopOpacity={0.15} />
                  <stop offset="95%" stopColor={sc} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={sc} strokeWidth={1.5} fill={`url(#sG${histKey})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function SensorPanel({ data, history }) {
  const gas      = data?.gas ?? 0;
  const gasColor = gas > 500 ? 'var(--red)' : gas > 250 ? 'var(--amber)' : 'var(--green)';
  const gasLevel = gas > 500 ? 'HIGH' : gas > 250 ? 'ELEVATED' : 'NORMAL';
  const chartData = history.map((h, i) => ({ i, v: h.gas ?? 0 }));

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Sensor Monitoring</div>
        <span className="badge badge-gray">5 Sensors</span>
      </div>
      <div className="card-body" style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <SensorCard icon={Zap} label="Current" value={data?.current ?? 0} unit="A" min={0} max={20} color="var(--blue)" sub="Load Current" history={history} histKey="current" warnAt={10} critAt={15} />
        <SensorCard icon={Thermometer} label="Temp 1" value={data?.temp1 ?? 0} unit="°C" min={0} max={100} color="var(--amber)" sub="Sensor 1" history={history} histKey="temp1" warnAt={55} critAt={65} />
        <SensorCard icon={Thermometer} label="Temp 2" value={data?.temp2 ?? 0} unit="°C" min={0} max={100} color="var(--amber)" sub="Sensor 2" history={history} histKey="temp2" warnAt={55} critAt={65} />
        <SensorCard icon={Activity} label="Vibration" value={data?.vibration ?? 0} unit="g" min={0} max={5} color="var(--yellow)" sub="Chassis Vibration" history={history} histKey="vibration" warnAt={1.5} critAt={3.0} />

        {/* Gas - custom */}
        <div style={{
          padding: 14, borderRadius: 10,
          background: gas > 500 ? 'var(--red-bg)' : gas > 250 ? 'var(--amber-bg)' : 'var(--surface)',
          border: `1px solid ${gas > 500 ? 'var(--red-border)' : gas > 250 ? 'var(--amber-border)' : 'var(--border)'}`,
          boxShadow: 'var(--shadow-xs)',
          display: 'flex', flexDirection: 'column', gap: 8, transition: 'all 0.4s',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Wind size={14} color={gasColor} />
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-2)' }}>Gas Emission</span>
            </div>
            <span className={`badge ${gas > 500 ? 'badge-red' : gas > 250 ? 'badge-amber' : 'badge-green'}`} style={{ fontSize: 9 }}>{gasLevel}</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <AnimatePresence mode="wait">
              <motion.span key={gas.toFixed(2)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--mono)', color: gasColor }}>
                {gas.toFixed(2)}
              </motion.span>
            </AnimatePresence>
            <span style={{ fontSize: 12, color: 'var(--text-3)' }}>ppm</span>
          </div>
          <div className="progress-track">
            <motion.div className="progress-fill" animate={{ width: `${Math.min(100, (gas / 1000) * 100)}%` }} transition={{ duration: 0.8 }} style={{ background: gasColor }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
            <span>0</span><span>500 ppm (Danger)</span><span>1000</span>
          </div>
        </div>
      </div>
    </div>
  );
}
