import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Battery, Cpu, BrainCircuit,
  AlertTriangle, Settings, Radio, ChevronRight, Zap, Beaker, Box
} from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Dashboard',      path: '/',         icon: LayoutDashboard },
  { label: 'Digital Twin',   path: '/twin',     icon: Box },
  { label: 'Cell Analytics', path: '/cells',    icon: Battery },
  { label: 'Sensor Monitor', path: '/sensors',  icon: Cpu },
  { label: 'AI Insights',    path: '/ai',       icon: BrainCircuit },
  { label: 'Research',       path: '/research', icon: Beaker },
  { label: 'Fault Reports',  path: '/faults',   icon: AlertTriangle },
  { label: 'Live Stream',    path: '/live',     icon: Radio },
  { label: 'System Config',  path: '/settings', icon: Settings },
];

export default function Sidebar({ data }) {
  const status = data?.status || 'Healthy';
  const statusColor = status === 'Healthy' ? 'var(--green)' : status === 'Warning' ? 'var(--amber)' : 'var(--red)';
  const statusBg    = status === 'Healthy' ? 'var(--green-bg)' : status === 'Warning' ? 'var(--amber-bg)' : 'var(--red-bg)';

  return (
    <aside className="sidebar">
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 34, height: 34, borderRadius: 9,
            background: 'linear-gradient(135deg, var(--yellow), #e07b00)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            <Zap size={18} color="#fff" strokeWidth={2.5} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>
              Edge Sense
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 500, letterSpacing: '0.04em' }}>
              BATTERY PLATFORM
            </div>
          </div>
        </div>
      </div>

      {/* Live Status */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
        <div style={{
          padding: '10px 12px',
          background: statusBg,
          border: `1px solid ${statusColor}30`,
          borderRadius: 8,
          display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <div style={{
            width: 8, height: 8, borderRadius: '50%',
            background: statusColor,
            flexShrink: 0,
            animation: 'dot-pulse 2s ease-in-out infinite',
          }} />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: statusColor }}>
              {status === 'Healthy' ? '● System Healthy' : status === 'Warning' ? '⚠ Warning Active' : '✕ Critical Fault'}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text-4)', marginTop: 1, fontFamily: 'var(--mono)' }}>
              Health: {data?.batteryHealth?.toFixed(1) ?? '--'}%
            </div>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.08em', textTransform: 'uppercase', padding: '0 8px 8px' }}>
          Navigation
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {NAV_ITEMS.map(({ label, path, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) => `sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <Icon size={16} className="nav-icon" style={{ flexShrink: 0 }} />
              <span style={{ flex: 1 }}>{label}</span>
              <ChevronRight size={12} style={{ opacity: 0.4 }} />
            </NavLink>
          ))}
        </div>
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid var(--border)' }}>
        <div style={{ fontSize: 10, color: 'var(--text-4)', textAlign: 'center' }}>
           
        </div>
        <div style={{ fontSize: 10, color: 'var(--text-4)', textAlign: 'center', marginTop: 2 }}>
          v2.0.0 · Edge Sense
        </div>
      </div>
    </aside>
  );
}
