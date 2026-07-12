import { useState } from 'react';
import { motion } from 'framer-motion';
import { Beaker, Thermometer, Zap, Wind, RotateCcw } from 'lucide-react';

const SCENARIOS = [
  {
    id: 'overtemp',
    label: 'Over Temperature',
    sub: 'Temp → 72°C | AI: Thermal Warning',
    icon: Thermometer,
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.25)',
  },
  {
    id: 'imbalance',
    label: 'Cell Imbalance',
    sub: 'Cell 3 → 3.40V | AI: Imbalance Detected',
    icon: Zap,
    color: '#ef4444',
    bg: 'rgba(239,68,68,0.1)',
    border: 'rgba(239,68,68,0.25)',
  },
  {
    id: 'gas',
    label: 'Gas Emission',
    sub: 'Gas → 850ppm | AI: Thermal Event',
    icon: Wind,
    color: '#c084fc',
    bg: 'rgba(192,132,252,0.1)',
    border: 'rgba(192,132,252,0.25)',
  },
];

export default function DemoPanel({ onScenarioChange, currentStatus }) {
  const [active, setActive] = useState('normal');
  const [loading, setLoading] = useState(null);

  async function trigger(scenarioId) {
    setLoading(scenarioId);
    try {
      const res = await fetch('/api/demo/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: scenarioId }),
      });
      if (res.ok) {
        setActive(scenarioId);
        onScenarioChange?.();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(null);
    }
  }

  async function reset() {
    setLoading('normal');
    try {
      await fetch('/api/demo/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: 'normal' }),
      });
      setActive('normal');
      onScenarioChange?.();
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="glass-card p-5 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Beaker size={18} color="var(--yellow)" />
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Demo Mode</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Caterpillar Fault Scenarios</p>
          </div>
        </div>
        {active !== 'normal' && (
          <span className="badge badge-amber animate-blink">DEMO ACTIVE</span>
        )}
      </div>

      {/* Instructions */}
      <div
        className="px-3 py-2 rounded-xl text-xs"
        style={{
          background: 'rgba(245,200,66,0.06)',
          border: '1px solid rgba(245,200,66,0.15)',
          color: 'var(--text-secondary)',
          lineHeight: 1.6,
        }}
      >
        Click a scenario below to simulate a fault. The dashboard will update in real-time. Auto-resets after 30s.
      </div>

      {/* Scenario buttons */}
      <div className="flex flex-col gap-3">
        {SCENARIOS.map((s) => {
          const Icon = s.icon;
          const isActive = active === s.id;
          const isLoading = loading === s.id;

          return (
            <motion.button
              key={s.id}
              onClick={() => trigger(s.id)}
              disabled={!!loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center gap-3 p-4 rounded-xl text-left relative overflow-hidden"
              style={{
                background: isActive ? s.bg : 'rgba(255,255,255,0.03)',
                border: `1.5px solid ${isActive ? s.border : 'rgba(255,255,255,0.06)'}`,
                cursor: loading ? 'not-allowed' : 'pointer',
                boxShadow: isActive ? `0 0 16px ${s.color}20` : 'none',
                transition: 'all 0.3s ease',
              }}
            >
              {/* Active glow */}
              {isActive && (
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background: `radial-gradient(circle at 20% 50%, ${s.color}08 0%, transparent 70%)`,
                  }}
                />
              )}

              <div
                className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${s.color}18`, border: `1px solid ${s.color}30` }}
              >
                {isLoading
                  ? <div className="w-4 h-4 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: s.color, borderTopColor: 'transparent' }} />
                  : <Icon size={18} color={s.color} />
                }
              </div>

              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm" style={{ color: isActive ? s.color : 'var(--text-primary)' }}>
                  {s.label}
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{s.sub}</div>
              </div>

              {isActive && (
                <div
                  className="w-2 h-2 rounded-full animate-pulse flex-shrink-0"
                  style={{ background: s.color }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Reset button */}
      <motion.button
        onClick={reset}
        disabled={active === 'normal' || !!loading}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm"
        style={{
          background: active !== 'normal' ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
          border: `1px solid ${active !== 'normal' ? 'rgba(34,197,94,0.25)' : 'rgba(255,255,255,0.06)'}`,
          color: active !== 'normal' ? 'var(--green)' : 'var(--text-muted)',
          cursor: active === 'normal' ? 'default' : 'pointer',
          transition: 'all 0.3s',
        }}
      >
        <RotateCcw size={15} />
        Reset to Normal
      </motion.button>

      {/* Footer note */}
      <div className="text-center text-xs" style={{ color: 'var(--text-muted)' }}>
        "Detect Early. Act Smart. Stay Safe."
      </div>
    </div>
  );
}
