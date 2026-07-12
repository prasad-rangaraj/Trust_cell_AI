import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, AlertTriangle, AlertCircle, CheckCircle, Clock } from 'lucide-react';

const SEVERITY_CONFIG = {
  Healthy: { icon: CheckCircle, color: 'var(--green)', bg: 'rgba(34,197,94,0.08)' },
  Normal: { icon: CheckCircle, color: 'var(--green)', bg: 'rgba(34,197,94,0.08)' },
  Warning: { icon: AlertTriangle, color: 'var(--amber)', bg: 'rgba(245,158,11,0.08)' },
  Critical: { icon: AlertCircle, color: 'var(--red)', bg: 'rgba(239,68,68,0.08)' },
};

function timeAgo(ts) {
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function LogRow({ log, index }) {
  const cfg = SEVERITY_CONFIG[log.severity] || SEVERITY_CONFIG.Normal;
  const Icon = cfg.icon;

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex items-start gap-3 p-3 rounded-xl"
      style={{
        background: cfg.bg,
        border: `1px solid ${cfg.color}20`,
      }}
    >
      <div className="flex-shrink-0 mt-0.5">
        <Icon size={15} color={cfg.color} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold text-sm" style={{ color: cfg.color }}>{log.faultType}</span>
          <span className="text-[10px] font-mono flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
            {timeAgo(log.timestamp)}
          </span>
        </div>
        <div className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{log.actionTaken}</div>
        {log.value && (
          <div className="font-mono text-[11px] mt-1" style={{ color: cfg.color, opacity: 0.8 }}>{log.value}</div>
        )}
      </div>
      <div className="flex-shrink-0">
        <span
          className="text-[9px] font-bold px-1.5 py-0.5 rounded "
          style={{ background: `${cfg.color}15`, color: cfg.color }}
        >
          {log.severity}
        </span>
      </div>
    </motion.div>
  );
}

// Local log entry when DB not connected
function LiveEntry({ data }) {
  const isNormal = data.status === 'Healthy';
  const color = isNormal ? 'var(--green)' : data.status === 'Warning' ? 'var(--amber)' : 'var(--red)';

  return (
    <div
      className="flex items-center gap-3 px-3 py-2 rounded-xl"
      style={{
        background: isNormal ? 'rgba(34,197,94,0.05)' : 'rgba(245,158,11,0.07)',
        border: `1px solid ${color}15`,
      }}
    >
      <div className="w-1.5 h-1.5 rounded-full animate-pulse flex-shrink-0" style={{ background: color }} />
      <span className="text-xs flex-1" style={{ color: 'var(--text-secondary)' }}>
        Live: Battery {data.status} — Score {data.anomalyScore?.toFixed(1)}% | Relay: {data.relay}
      </span>
      <span className="font-mono text-[10px]" style={{ color: 'var(--text-muted)' }}>NOW</span>
    </div>
  );
}

export default function EventLog({ faults, data }) {
  return (
    <div className="glass-card p-5 flex flex-col gap-4 h-full">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ClipboardList size={18} color="var(--yellow)" />
          <div>
            <h2 className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Fault Event Log</h2>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>AI-detected events & system actions</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Clock size={12} color="var(--text-muted)" />
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{faults.length} events</span>
        </div>
      </div>

      {/* Live entry */}
      <LiveEntry data={data} />

      {/* Log list */}
      <div className="flex flex-col gap-2 overflow-y-auto" style={{ maxHeight: 280 }}>
        <AnimatePresence>
          {faults.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex flex-col items-center justify-center py-8 gap-2"
            >
              <CheckCircle size={32} color="var(--green)" />
              <span className="text-sm font-semibold" style={{ color: 'var(--green)' }}>No faults detected</span>
              <span className="text-xs" style={{ color: 'var(--text-muted)' }}>System operating normally</span>
            </motion.div>
          ) : (
            faults.map((log, i) => <LogRow key={log.id ?? i} log={log} index={i} />)
          )}
        </AnimatePresence>
      </div>

      {/* Footer */}
      <div
        className="flex items-center gap-2 pt-3 mt-auto"
        style={{ borderTop: '1px solid rgba(255,255,255,0.04)' }}
      >
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: 'var(--green)' }} />
        <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
          Logging to PostgreSQL via Prisma — 2s interval
        </span>
      </div>
    </div>
  );
}
