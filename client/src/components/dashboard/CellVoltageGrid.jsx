import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';

const NORMAL_MIN = 3.7;
const WARN_MIN   = 3.6;
const NORMAL_MAX = 4.2;

function CellCard({ label, voltage, index, history }) {
  const isImbalanced = voltage < WARN_MIN || voltage > NORMAL_MAX;
  const isLow   = !isImbalanced && voltage < NORMAL_MIN;
  const isNormal = !isImbalanced && !isLow;

  const color  = isImbalanced ? 'var(--red)' : isLow ? 'var(--amber)' : 'var(--green)';
  const bg     = isImbalanced ? 'var(--red-bg)' : isLow ? 'var(--amber-bg)' : 'var(--green-bg)';
  const border = isImbalanced ? 'var(--red-border)' : isLow ? 'var(--amber-border)' : 'var(--green-border)';
  const status = isImbalanced ? 'Imbalanced' : isLow ? 'Low' : 'Normal';
  const cls    = isImbalanced ? 'badge-red' : isLow ? 'badge-amber' : 'badge-green';

  const fillPct   = Math.max(0, Math.min(100, ((voltage - 3.0) / 1.12) * 100));
  const chartData = history.map((h, i) => ({ i, v: h[`cell${index + 1}`] ?? 0 }));

  return (
    <div style={{
      padding: 14, borderRadius: 10,
      background: isImbalanced ? 'var(--red-bg)' : isLow ? 'var(--amber-bg)' : 'var(--surface)',
      border: `1px solid ${border}`,
      boxShadow: 'var(--shadow-xs)',
      display: 'flex', flexDirection: 'column', gap: 10,
      transition: 'all 0.4s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{
            width: 24, height: 24, borderRadius: 6,
            background: `${color}18`, border: `1px solid ${color}30`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 10, fontWeight: 800, color,
          }}>
            {label}
          </div>
          <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Cell {index + 1}</span>
        </div>
        <span className={`badge ${cls}`} style={{ fontSize: 9 }}>{status}</span>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 3 }}>
            <AnimatePresence mode="wait">
              <motion.span
                key={voltage?.toFixed(2)}
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                style={{ fontSize: 26, fontWeight: 900, fontFamily: 'var(--mono)', color, lineHeight: 1 }}
              >
                {voltage?.toFixed(2)}
              </motion.span>
            </AnimatePresence>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>V</span>
          </div>
          <div style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>Min: 3.0V / Max: 4.12V</div>
        </div>

        {/* Liquid Battery Indicator */}
        <div className="liquid-battery-shell">
          <div className="liquid-battery-nub" />
          <div className="liquid-battery-body" style={{ background: color }}>
            <div className="liquid-battery-wave" style={{ background: bg, top: `${100 - fillPct}%` }} />
            <div className="liquid-battery-wave layer2" style={{ top: `${100 - fillPct}%` }} />
            <div className="liquid-battery-pct">{Math.round(fillPct)}%</div>
          </div>
        </div>
      </div>

      {chartData.length > 3 && (
        <div style={{ height: 48, marginTop: 'auto' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 0, right: 0, bottom: 0, left: 0 }}>
              <defs>
                <linearGradient id={`cG${index}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor={color} stopOpacity={0.2} />
                  <stop offset="95%" stopColor={color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area type="monotone" dataKey="v" stroke={color} strokeWidth={1.5} fill={`url(#cG${index})`} dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export default function CellVoltageGrid({ data, history }) {
  const cells    = [data?.cell1, data?.cell2, data?.cell3, data?.cell4].map((v, i) => ({ label: `C${i+1}`, voltage: v ?? 0, index: i }));
  const voltages = cells.map(c => c.voltage);
  const spread   = (Math.max(...voltages) - Math.min(...voltages)).toFixed(3);
  const packV    = voltages.reduce((a, b) => a + b, 0).toFixed(2);
  const avgV     = (voltages.reduce((a, b) => a + b, 0) / 4).toFixed(3);

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Cell Voltage Monitor</div>
          <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>4S Li-ion Pack — Individual cell tracking</div>
        </div>
        <div style={{ display: 'flex', gap: 14 }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Pack Voltage</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: 'var(--yellow)' }}>{packV}V</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Spread</div>
            <div style={{
              fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13,
              color: parseFloat(spread) > 0.15 ? 'var(--red)' : 'var(--green)',
            }}>{spread}V</div>
          </div>
        </div>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 24, justifyContent: 'center' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {cells.map((cell) => (
            <CellCard key={cell.label} {...cell} history={history} />
          ))}
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10,
          padding: '12px 14px', background: 'var(--surface-2)',
          border: '1px solid var(--border)', borderRadius: 8,
        }}>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Average Cell</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: 'var(--text)' }}>{avgV}V</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Max Spread</div>
            <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 13, color: parseFloat(spread) > 0.15 ? 'var(--red)' : 'var(--green)' }}>{spread}V</div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Balance</div>
            <div style={{ fontWeight: 700, fontSize: 12, color: parseFloat(spread) > 0.15 ? 'var(--red)' : 'var(--green)' }}>
              {parseFloat(spread) > 0.15 ? '⚠ Imbalanced' : '✓ Balanced'}
            </div>
          </div>
          <div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Nominal</div>
            <div style={{ fontFamily: 'var(--mono)', fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>3.7 – 4.12V</div>
          </div>
        </div>
      </div>
    </div>
  );
}
