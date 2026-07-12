import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, AlertTriangle, X } from 'lucide-react';

function Toast({ toast }) {
  const isC = toast.type === 'critical';
  const color = isC ? 'var(--red)' : 'var(--amber)';
  const bg    = isC ? 'var(--red-bg)' : 'var(--amber-bg)';
  const bdr   = isC ? 'var(--red-border)' : 'var(--amber-border)';
  const Icon  = isC ? AlertCircle : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 40 }}
      transition={{ type: 'spring', stiffness: 350, damping: 28 }}
      style={{
        background: bg, border: `1px solid ${bdr}`,
        borderRadius: 10, padding: '12px 16px',
        display: 'flex', gap: 10, alignItems: 'flex-start',
        boxShadow: 'var(--shadow-md)', pointerEvents: 'all',
        minWidth: 260, maxWidth: 320,
      }}
    >
      <Icon size={16} color={color} style={{ flexShrink: 0, marginTop: 1 }} />
      <div style={{ flex: 1 }}>
        <div style={{ fontWeight: 700, fontSize: 13, color }}>{toast.message}</div>
        {toast.sub && <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>{toast.sub}</div>}
      </div>
    </motion.div>
  );
}

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => <Toast key={t.id} toast={t} />)}
      </AnimatePresence>
    </div>
  );
}
