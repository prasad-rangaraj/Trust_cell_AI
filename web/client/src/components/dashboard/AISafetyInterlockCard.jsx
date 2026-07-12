import { motion } from 'framer-motion';
import { ShieldCheck, ShieldAlert, Lock, Unlock, Power } from 'lucide-react';

export default function AISafetyInterlockCard({ data }) {
  // Determine if the AI has authorized driving
  const mlOp = data?.mlOp || 'NORMAL';
  const hasFault = data?.spn !== undefined || mlOp !== 'NORMAL';
  const riskScore = data?.aiPrediction?.risk_score ?? 10.0;
  
  const isInterlockActive = hasFault || riskScore > 80;

  const StatusIcon = isInterlockActive ? ShieldAlert : ShieldCheck;
  const statusColor = isInterlockActive ? 'var(--red)' : 'var(--green)';
  const statusText = isInterlockActive ? 'SYSTEM LOCKOUT' : 'AUTHORIZED';

  return (
    <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', background: isInterlockActive ? 'var(--red-950)' : 'var(--surface)' }}>
      <div className="card-header" style={{ borderBottomColor: isInterlockActive ? 'rgba(239, 68, 68, 0.2)' : 'var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Power size={16} color={statusColor} />
          <span style={{ fontSize: 13, fontWeight: 700, color: isInterlockActive ? '#fff' : 'var(--text)' }}>AI Safety Interlock</span>
        </div>
      </div>
      <div className="card-body" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', justifyContent: 'center' }}>
        
        <motion.div 
          animate={{ scale: isInterlockActive ? [1, 1.05, 1] : 1 }}
          transition={{ repeat: isInterlockActive ? Infinity : 0, duration: 2 }}
          style={{ 
            width: 80, height: 80, borderRadius: '50%', 
            background: isInterlockActive ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)', 
            border: `2px solid ${statusColor}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 20px ${isInterlockActive ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.2)'}`
          }}
        >
          {isInterlockActive ? <Lock size={32} color={statusColor} /> : <Unlock size={32} color={statusColor} />}
        </motion.div>

        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 900, color: statusColor, letterSpacing: 1, marginBottom: 4 }}>
            {statusText}
          </div>
          <div style={{ fontSize: 11, color: isInterlockActive ? 'rgba(255,255,255,0.7)' : 'var(--text-4)', maxWidth: 180, margin: '0 auto' }}>
            {isInterlockActive 
              ? `Powertrain disabled by AI supervisor. Reason: ${mlOp}` 
              : 'All sensor trust and AI metrics nominal. Powertrain enabled.'}
          </div>
        </div>

      </div>
    </div>
  );
}
