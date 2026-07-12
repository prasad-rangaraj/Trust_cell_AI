import { motion, AnimatePresence } from 'framer-motion';
import { ClipboardList, CheckCircle, AlertTriangle, AlertCircle, Clock } from 'lucide-react';

const SEV = {
  Healthy: { Icon: CheckCircle, color: 'var(--green)', cls: 'badge-green' },
  Normal:  { Icon: CheckCircle, color: 'var(--green)', cls: 'badge-green' },
  Warning: { Icon: AlertTriangle, color: 'var(--amber)', cls: 'badge-amber' },
  Critical:{ Icon: AlertCircle,  color: 'var(--red)',   cls: 'badge-red' },
};

function timeAgo(ts) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return `${Math.floor(d/1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
  return new Date(ts).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export default function EventLog({ faults, data }) {
  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <ClipboardList size={16} color="var(--yellow)" />
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Fault Event Log</div>
            <div style={{ fontSize: 10, color: 'var(--text-4)' }}>AI-detected events & system actions</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11, color: 'var(--text-4)' }}>
          <Clock size={11} />
          {faults.length} events
        </div>
      </div>

      {/* Live ticker */}
      <div style={{
        margin: '0 16px', padding: '8px 12px',
        background: data?.status === 'Healthy' ? 'var(--green-bg)' : 'var(--amber-bg)',
        border: `1px solid ${data?.status === 'Healthy' ? 'var(--green-border)' : 'var(--amber-border)'}`,
        borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, marginTop: 12,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: data?.status === 'Healthy' ? 'var(--green)' : 'var(--amber)', animation: 'dot-pulse 2s ease-in-out infinite', flexShrink: 0 }} />
        <span style={{ fontSize: 11, color: 'var(--text-2)', flex: 1 }}>
          Live: {data?.status} — Score {data?.anomalyScore?.toFixed(1)}% | Relay: {data?.relay}
        </span>
        <span style={{ fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>NOW</span>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto', maxHeight: 240, paddingTop: 12 }}>
        <AnimatePresence>
          {faults.length === 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px 0', gap: 8 }}>
              <CheckCircle size={28} color="var(--green)" />
              <span style={{ fontWeight: 600, color: 'var(--green)', fontSize: 13 }}>No faults detected</span>
              <span style={{ fontSize: 11, color: 'var(--text-4)' }}>System operating normally</span>
            </div>
          ) : faults.map((log, i) => {
            const cfg = SEV[log.severity] || SEV.Normal;
            const { Icon, color, cls } = cfg;
            return (
              <motion.div
                key={log.id ?? i}
                initial={{ opacity: 0, x: -12 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                style={{
                  display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 12px', borderRadius: 8,
                  background: 'var(--surface-2)', border: '1px solid var(--border)',
                }}
              >
                <Icon size={13} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                    <span style={{ fontWeight: 600, fontSize: 12, color }}>{log.faultType}</span>
                    <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-4)', flexShrink: 0 }}>{timeAgo(log.timestamp)}</span>
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 1 }}>{log.actionTaken}</div>
                  {log.value && <div style={{ fontFamily: 'var(--mono)', fontSize: 10, color, marginTop: 2 }}>{log.value}</div>}
                </div>
                <span className={`badge ${cls}`} style={{ fontSize: 9, flexShrink: 0 }}>{log.severity}</span>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      <div className="card-footer" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--green)', animation: 'dot-pulse 2s ease-in-out infinite' }} />
        <span style={{ fontSize: 11, color: 'var(--text-3)' }}>Logging to PostgreSQL via Prisma — 2s interval</span>
      </div>
    </div>
  );
}
