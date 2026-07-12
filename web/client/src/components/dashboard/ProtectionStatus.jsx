import { motion } from 'framer-motion';
import { Shield, Power, Bell, Radio } from 'lucide-react';

function StatusRow({ icon: Icon, label, value, isAlert, color, bg, border, desc }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 8,
      background: isAlert ? bg : 'var(--surface)',
      border: `1px solid ${isAlert ? border : 'var(--border)'}`,
      display: 'flex', alignItems: 'center', gap: 12,
      transition: 'all 0.4s',
    }}>
      <div style={{
        width: 36, height: 36, borderRadius: 8, flexShrink: 0,
        background: `${color}12`, border: `1px solid ${color}25`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <Icon size={16} color={color} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.05em' }}>{label}</div>
        <div style={{ fontFamily: 'var(--mono)', fontWeight: 700, fontSize: 12, color, marginTop: 1 }}>{value}</div>
        {desc && <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1 }}>{desc}</div>}
      </div>
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <div style={{ width: 10, height: 10, borderRadius: '50%', background: color }} />
        {isAlert && (
          <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: color, opacity: 0.3, animation: 'dot-pulse 2s ease-in-out infinite' }} />
        )}
      </div>
    </div>
  );
}

export default function ProtectionStatus({ data }) {
  const relayOn   = data?.relay === 'CONNECTED';
  const isHealthy = data?.status === 'Healthy';
  const isWarn    = data?.status === 'Warning';
  const isCrit    = data?.status === 'Critical';

  return (
    <motion.div
      className="card animate-in"
      style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.12 }}
    >
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Shield size={16} color="var(--yellow)" />
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>Protection Status</span>
        </div>
        <span className={`badge ${isCrit ? 'badge-red' : isWarn ? 'badge-amber' : 'badge-green'}`}>
          {isCrit ? 'FAULT' : isWarn ? 'ALERT' : 'SECURE'}
        </span>
      </div>

      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, justifyContent: 'space-between' }}>
        <StatusRow
          icon={Power}
          label="Relay Status"
          value={relayOn ? 'CONNECTED' : 'DISCONNECTED'}
          isAlert={!relayOn}
          color={relayOn ? 'var(--green)' : 'var(--red)'}
          bg="var(--red-bg)" border="var(--red-border)"
          desc={relayOn ? 'Battery pack connected to load' : 'Pack isolated for protection'}
        />
        <StatusRow
          icon={Bell}
          label="Alert Status"
          value={isHealthy ? 'NORMAL' : isWarn ? 'WARNING ACTIVE' : 'CRITICAL ALERT'}
          isAlert={!isHealthy}
          color={isHealthy ? 'var(--green)' : isWarn ? 'var(--amber)' : 'var(--red)'}
          bg={isWarn ? 'var(--amber-bg)' : 'var(--red-bg)'}
          border={isWarn ? 'var(--amber-border)' : 'var(--red-border)'}
          desc={isHealthy ? 'All parameters within limits' : 'TinyML anomaly detected'}
        />
        <StatusRow
          icon={Radio}
          label="Communication"
          value="MQTT → Express → DB"
          isAlert={false}
          color="var(--blue)"
          bg="var(--blue-bg)" border="var(--blue-border)"
          desc="STM32 → GSM → Cloud → Dashboard"
        />

        {/* Architecture */}
        <div style={{
          marginTop: 4, padding: '12px 14px', borderRadius: 8,
          background: 'var(--yellow-bg)', border: '1px solid var(--yellow-border)',
        }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--yellow)', letterSpacing: '0.06em', marginBottom: 8 }}>
            System Stack
          </div>
          <div style={{ fontFamily: 'var(--mono)', fontSize: 11, lineHeight: 2, color: 'var(--text-2)' }}>
            STM32 + TinyML<br/>
            <span style={{ color: 'var(--yellow)' }}>↓ GSM / MQTT</span><br/>
            Express.js + Prisma<br/>
            <span style={{ color: 'var(--yellow)' }}>↓ Socket.io</span><br/>
            React Dashboard
          </div>
        </div>
      </div>
    </motion.div>
  );
}
