import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, ShieldAlert, ShieldX, Zap } from 'lucide-react';

const config = {
  Healthy: {
    label: 'PREDICTIVE SAFETY STATUS',
    value: 'ALL SYSTEMS SAFE',
    sub: 'No anomalies detected — Battery operating within nominal parameters',
    icon: ShieldCheck,
    bg: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(34,197,94,0.04))',
    border: 'rgba(34,197,94,0.25)',
    color: '#22c55e',
    glow: '0 0 40px rgba(34,197,94,0.15)',
    dot: '#22c55e',
  },
  Warning: {
    label: 'PREDICTIVE SAFETY STATUS',
    value: 'EARLY ANOMALY DETECTED',
    sub: 'AI has flagged abnormal battery behavior — Monitor closely',
    icon: ShieldAlert,
    bg: 'linear-gradient(135deg, rgba(245,158,11,0.14), rgba(245,158,11,0.04))',
    border: 'rgba(245,158,11,0.3)',
    color: '#f59e0b',
    glow: '0 0 40px rgba(245,158,11,0.2)',
    dot: '#f59e0b',
  },
  Critical: {
    label: 'PREDICTIVE SAFETY STATUS',
    value: '⚠ CRITICAL FAULT — RELAY ISOLATED',
    sub: 'Battery pack isolated for safety — Immediate inspection required',
    icon: ShieldX,
    bg: 'linear-gradient(135deg, rgba(239,68,68,0.18), rgba(239,68,68,0.06))',
    border: 'rgba(239,68,68,0.4)',
    color: '#ef4444',
    glow: '0 0 60px rgba(239,68,68,0.25)',
    dot: '#ef4444',
  },
};

export default function SafetyBanner({ data }) {
  const cfg = config[data.status] || config.Healthy;
  const Icon = cfg.icon;

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={data.status}
        initial={{ opacity: 0, y: -12, scale: 0.99 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 12, scale: 0.99 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="mt-4 rounded-2xl px-6 py-4 flex items-center gap-5 relative overflow-hidden"
        style={{
          background: cfg.bg,
          border: `1px solid ${cfg.border}`,
          boxShadow: cfg.glow,
        }}
      >
        {/* Animated background shimmer for critical */}
        {data.status === 'Critical' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background: 'repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(239,68,68,0.03) 20px, rgba(239,68,68,0.03) 21px)',
            }}
          />
        )}

        {/* Icon with pulse ring */}
        <div className="relative flex-shrink-0">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center`}
            style={{ background: `${cfg.color}1a`, border: `1.5px solid ${cfg.color}40` }}
          >
            <Icon size={28} color={cfg.color} strokeWidth={1.8} />
          </div>
          {data.status !== 'Healthy' && (
            <div
              className="absolute inset-0 rounded-2xl animate-pulse-ring"
              style={{ border: `2px solid ${cfg.color}`, opacity: 0.4 }}
            />
          )}
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold tracking-widest  mb-1" style={{ color: `${cfg.color}99` }}>
            {cfg.label}
          </div>
          <div
            className="text-xl md:text-2xl font-black tracking-tight"
            style={{ color: cfg.color, fontFamily: 'JetBrains Mono, monospace' }}
          >
            {cfg.value}
          </div>
          <div className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
            {cfg.sub}
          </div>
        </div>

        {/* Right: Score */}
        <div
          className="hidden md:flex flex-col items-end flex-shrink-0"
        >
          <div className="text-xs tracking-widest  font-semibold mb-1" style={{ color: 'var(--text-muted)' }}>
            AI Anomaly
          </div>
          <div
            className="font-mono text-4xl font-black"
            style={{ color: cfg.color }}
          >
            {data.anomalyScore?.toFixed(1)}%
          </div>
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ background: cfg.dot }}
            />
            <span className="text-xs font-semibold " style={{ color: cfg.color }}>
              {data.status}
            </span>
          </div>
        </div>

        <Zap size={160} className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
          style={{ color: cfg.color, opacity: 0.04 }} />
      </motion.div>
    </AnimatePresence>
  );
}
