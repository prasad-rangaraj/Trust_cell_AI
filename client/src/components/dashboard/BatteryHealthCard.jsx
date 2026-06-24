import { motion } from 'framer-motion';
import { Battery, TrendingUp, TrendingDown } from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, Tooltip } from 'recharts';

function BatteryVisual({ pct, color }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div style={{
        position: 'relative', width: 110, height: 36,
        background: 'var(--surface-3)', border: '1.5px solid var(--border-2)',
        borderRadius: 6, overflow: 'hidden',
      }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{ position: 'absolute', inset: 0, background: color, right: 'auto' }}
        />
        <div style={{
          position: 'absolute', inset: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12,
          color: pct > 40 ? '#fff' : 'var(--text-2)',
        }}>
          {pct.toFixed(0)}%
        </div>
      </div>
      <div style={{ width: 5, height: 14, background: 'var(--border-2)', borderRadius: 2, border: '1px solid var(--border)' }} />
    </div>
  );
}

export default function BatteryHealthCard({ data, history }) {
  const pct   = data?.batteryHealth ?? 0;
  const color = pct >= 80 ? 'var(--green)' : pct >= 60 ? 'var(--amber)' : 'var(--red)';
  const label = pct >= 80 ? 'Healthy' : pct >= 60 ? 'Degraded' : 'Critical';
  const cls   = pct >= 80 ? 'badge-green' : pct >= 60 ? 'badge-amber' : 'badge-red';

  const chartData = history.map((h, i) => ({ i, v: h.batteryHealth ?? 0 }));
  const prev      = history.length >= 2 ? history[history.length - 2]?.batteryHealth : pct;
  const trending  = pct >= (prev ?? pct);

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
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Battery Health</span>
        </div>
        <span className={`badge ${cls}`}>
          <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'currentColor', display: 'inline-block' }} />
          {label}
        </span>
      </div>
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6 }}>
          <motion.span
            key={Math.round(pct)}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{ fontSize: 52, fontWeight: 900, fontFamily: 'var(--mono)', lineHeight: 1, color }}
          >
            {pct.toFixed(1)}
          </motion.span>
          <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>%</span>
          <div style={{ marginBottom: 6 }}>
            {trending ? <TrendingUp size={16} color="var(--green)" /> : <TrendingDown size={16} color="var(--red)" />}
          </div>
        </div>

        <BatteryVisual pct={pct} color={color} />

        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'var(--text-3)', marginBottom: 5 }}>
            <span>State of Health</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color }}>{pct.toFixed(1)}%</span>
          </div>
          <div className="progress-track">
            <motion.div
              className="progress-fill"
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1 }}
              style={{ background: color }}
            />
          </div>
        </div>

        {chartData.length > 3 && (
          <div style={{ flex: 1, minHeight: 48, display: 'flex', flexDirection: 'column' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 2, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="bhG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor={color} stopOpacity={0.15} />
                    <stop offset="95%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Tooltip
                  contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }}
                  formatter={(v) => [`${v?.toFixed(1)}%`, 'Health']}
                  labelFormatter={() => ''}
                />
                <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill="url(#bhG)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </motion.div>
  );
}
