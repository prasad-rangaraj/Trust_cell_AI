import { motion } from 'framer-motion';
import { Power, Bell, Shield, Radio } from 'lucide-react';

function StatusRow({ icon: Icon, label, value, active, color, description }) {
  return (
    <div
      className="flex items-center gap-4 p-4 rounded-xl"
      style={{
        background: active ? `${color}0d` : 'rgba(255,255,255,0.025)',
        border: `1px solid ${active ? `${color}30` : 'rgba(255,255,255,0.05)'}`,
        transition: 'all 0.4s ease',
        boxShadow: active ? `0 0 12px ${color}15` : 'none',
      }}
    >
      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `${color}18`, border: `1px solid ${color}25` }}
      >
        <Icon size={18} color={color} />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{label}</div>
        <div className="font-mono font-bold text-sm mt-0.5" style={{ color }}>{value}</div>
        {description && (
          <div className="text-[10px] mt-0.5 truncate" style={{ color: 'var(--text-muted)' }}>{description}</div>
        )}
      </div>

      {/* Indicator */}
      <div className="flex-shrink-0 flex items-center gap-2">
        <div className="relative">
          <div className="w-3 h-3 rounded-full" style={{ background: color }} />
          {active && (
            <div
              className="absolute inset-0 rounded-full animate-ping"
              style={{ background: color, opacity: 0.5 }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default function ProtectionStatus({ data }) {
  const relayOn = data.relay === 'CONNECTED';
  const alertNormal = data.status === 'Healthy';
  const isCritical = data.status === 'Critical';

  return (
    <motion.div
      className="glass-card p-5 h-full flex flex-col gap-4"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Shield size={18} color="var(--yellow)" />
          <span className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>Protection Status</span>
        </div>
        <span
          className={`badge ${isCritical ? 'badge-red' : alertNormal ? 'badge-green' : 'badge-amber'}`}
        >
          {isCritical ? 'FAULT' : alertNormal ? 'SECURE' : 'ALERT'}
        </span>
      </div>

      {/* Status rows */}
      <div className="flex flex-col gap-3">
        <StatusRow
          icon={Power}
          label="RELAY STATUS"
          value={relayOn ? 'CONNECTED' : 'DISCONNECTED — Battery Isolated'}
          active={!relayOn}
          color={relayOn ? '#22c55e' : '#ef4444'}
          description={relayOn ? 'Battery pack connected to load' : 'Pack isolated for protection'}
        />

        <StatusRow
          icon={Bell}
          label="ALERT STATUS"
          value={alertNormal ? 'NORMAL — No Faults' : data.status === 'Warning' ? 'WARNING ACTIVE' : 'CRITICAL ALERT'}
          active={!alertNormal}
          color={alertNormal ? '#22c55e' : data.status === 'Warning' ? '#f59e0b' : '#ef4444'}
          description={alertNormal ? 'All parameters within limits' : 'AI anomaly detected'}
        />

        <StatusRow
          icon={Radio}
          label="COMMUNICATION"
          value="MQTT → Express → DB"
          active={true}
          color="#3b82f6"
          description="STM32 → GSM → Cloud → Dashboard"
        />
      </div>

      {/* Summary box */}
      <div
        className="mt-auto rounded-xl p-4"
        style={{
          background: 'linear-gradient(135deg, rgba(245,200,66,0.06), rgba(245,200,66,0.02))',
          border: '1px solid rgba(245,200,66,0.15)',
        }}
      >
        <div className="text-xs font-semibold  tracking-wider mb-2" style={{ color: 'rgba(245,200,66,0.7)' }}>
          System Architecture
        </div>
        <div className="font-mono text-xs leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
          STM32 + TinyML<br/>
          <span style={{ color: 'rgba(245,200,66,0.5)' }}>↓ GSM / MQTT</span><br/>
          Express.js Backend<br/>
          <span style={{ color: 'rgba(245,200,66,0.5)' }}>↓ Prisma ORM</span><br/>
          PostgreSQL Database<br/>
          <span style={{ color: 'rgba(245,200,66,0.5)' }}>↓ Socket.io</span><br/>
          React Dashboard
        </div>
      </div>
    </motion.div>
  );
}
