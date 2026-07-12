import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX } from 'lucide-react';

const CFG = {
  Healthy: {
    cls: 'healthy', Icon: ShieldCheck, color: 'var(--green)',
    label: 'ALL SYSTEMS SAFE',
    sub: 'No anomalies detected — Operating within nominal parameters',
  },
  Warning: {
    cls: 'warning', Icon: ShieldAlert, color: 'var(--amber)',
    label: 'EARLY ANOMALY DETECTED',
    sub: 'TinyML has flagged abnormal battery behavior — Monitor closely',
  },
  Critical: {
    cls: 'critical', Icon: ShieldX, color: 'var(--red)',
    label: '⚠ CRITICAL FAULT — RELAY ISOLATED',
    sub: 'Battery pack isolated for protection — Immediate inspection required',
  },
};

export default function SafetyBanner({ data }) {
  const cfg = CFG[data?.status] || CFG.Healthy;
  const { Icon, color, cls, label, sub } = cfg;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={data?.status}
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 8 }}
        transition={{ duration: 0.3 }}
        className={`safety-banner ${cls}`}
      >
        <div style={{
          width: 44, height: 44, borderRadius: 10,
          background: `${color}18`, border: `1.5px solid ${color}30`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={22} color={color} strokeWidth={1.8} />
        </div>

        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: '0.08em', marginBottom: 3 }}>
            Predictive Safety Status
          </div>
          <div style={{ fontSize: 16, fontWeight: 800, color, fontFamily: 'var(--mono)', letterSpacing: '-0.01em' }}>
            {label}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{sub}</div>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)', letterSpacing: '0.06em' }}>
            AI Score
          </div>
          <div style={{ fontSize: 28, fontWeight: 900, color, fontFamily: 'var(--mono)', lineHeight: 1.1 }}>
            {data?.anomalyScore?.toFixed(1)}%
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, justifyContent: 'flex-end', marginTop: 2 }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: color, animation: 'dot-pulse 2s ease-in-out infinite' }} />
            <span style={{ fontSize: 11, fontWeight: 700, color }}>{data?.status}</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
