import { useState } from 'react';
import { motion } from 'framer-motion';
import { Beaker, Thermometer, Zap, Wind, RotateCcw } from 'lucide-react';

const SCENARIOS = [
  { id: 'overtemp',  label: 'Over Temperature', sub: 'Temp → 72°C | AI: Thermal Warning',       icon: Thermometer, color: 'var(--amber)', bg: 'var(--amber-bg)', border: 'var(--amber-border)' },
  { id: 'imbalance', label: 'Cell Imbalance',   sub: 'Cell 3 → 3.40V | AI: Imbalance',          icon: Zap,         color: 'var(--red)',   bg: 'var(--red-bg)',   border: 'var(--red-border)' },
  { id: 'gas',       label: 'Gas Emission',      sub: 'Gas → 850ppm | AI: Thermal Event',         icon: Wind,        color: 'var(--purple)',bg: 'var(--purple-bg)',border: 'var(--purple-border)' },
];

export default function DemoPanel({ onScenarioChange }) {
  const [active, setActive] = useState('normal');
  const [loading, setLoading] = useState(null);

  async function trigger(id) {
    setLoading(id);
    try {
      const r = await fetch('/api/demo/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: id }),
      });
      if (r.ok) { setActive(id); onScenarioChange?.(); }
    } finally { setLoading(null); }
  }

  async function reset() {
    setLoading('normal');
    try {
      await fetch('/api/demo/scenario', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scenario: 'normal' }) });
      setActive('normal'); onScenarioChange?.();
    } finally { setLoading(null); }
  }

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Beaker size={16} color="var(--yellow)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Demo Mode</div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Caterpillar Fault Scenarios</div>
          </div>
        </div>
        {active !== 'normal' && <span className="badge badge-amber">DEMO ACTIVE</span>}
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
        <div style={{
          padding: '10px 12px', borderRadius: 8,
          background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)',
          fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6,
        }}>
          Click a scenario to simulate a fault. Dashboard updates in real-time. Auto-resets after 30s.
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {SCENARIOS.map((s) => {
            const Icon = s.icon;
            const isA  = active === s.id;
            const isL  = loading === s.id;
            return (
              <motion.button
                key={s.id}
                onClick={() => trigger(s.id)}
                disabled={!!loading}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '12px 14px', borderRadius: 8, textAlign: 'left',
                  background: isA ? s.bg : 'var(--surface)',
                  border: `1px solid ${isA ? s.border : 'var(--border)'}`,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: 'var(--shadow-xs)',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: `${s.color}15`, border: `1px solid ${s.color}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isL
                    ? <div style={{ width: 14, height: 14, borderRadius: '50%', border: `2px solid ${s.color}`, borderTopColor: 'transparent', animation: 'spin 0.8s linear infinite' }} />
                    : <Icon size={16} color={s.color} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: 13, color: isA ? s.color : 'var(--text)' }}>{s.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-4)', marginTop: 1 }}>{s.sub}</div>
                </div>
                {isA && <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, animation: 'dot-pulse 2s ease-in-out infinite', flexShrink: 0 }} />}
              </motion.button>
            );
          })}
        </div>

        <button
          onClick={reset}
          disabled={active === 'normal' || !!loading}
          className="btn btn-secondary"
          style={{ marginTop: 'auto', justifyContent: 'center', gap: 6, color: active !== 'normal' ? 'var(--green)' : undefined }}
        >
          <RotateCcw size={13} />
          Reset to Normal
        </button>

        <div style={{ textAlign: 'center', fontSize: 11, color: 'var(--text-4)', fontStyle: 'italic' }}>
          "Detect Early. Act Smart. Stay Safe."
        </div>
      </div>
    </div>
  );
}
