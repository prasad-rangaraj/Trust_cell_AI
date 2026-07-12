import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, AlertCircle, X } from 'lucide-react';

function Toast({ toast }) {
  const isCritical = toast.type === 'critical';
  const color = isCritical ? 'var(--red)' : 'var(--amber)';
  const bg = isCritical ? 'rgba(239,68,68,0.12)' : 'rgba(245,158,11,0.1)';
  const border = isCritical ? 'rgba(239,68,68,0.35)' : 'rgba(245,158,11,0.3)';
  const Icon = isCritical ? AlertCircle : AlertTriangle;

  return (
    <motion.div
      initial={{ opacity: 0, x: 80, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 80, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="flex items-start gap-3 px-4 py-3 rounded-xl min-w-[280px] max-w-[340px]"
      style={{
        background: bg,
        border: `1px solid ${border}`,
        backdropFilter: 'blur(12px)',
        boxShadow: `0 8px 32px rgba(0,0,0,0.4), 0 0 20px ${color}20`,
        pointerEvents: 'all',
      }}
    >
      <Icon size={18} color={color} className="flex-shrink-0 mt-0.5" />
      <div className="flex-1 min-w-0">
        <div className="font-bold text-sm" style={{ color }}>{toast.message}</div>
        {toast.sub && <div className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{toast.sub}</div>}
      </div>
    </motion.div>
  );
}

export default function ToastContainer({ toasts }) {
  return (
    <div className="toast-container">
      <AnimatePresence mode="popLayout">
        {toasts.map((t) => (
          <Toast key={t.id} toast={t} />
        ))}
      </AnimatePresence>
    </div>
  );
}
