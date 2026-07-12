import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import {
  AlertTriangle, AlertCircle, CheckCircle, Trash2, RefreshCw,
  Search, Clock, Zap, Thermometer, Wind, Activity, Shield, TrendingDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/* ── Helpers ────────────────────────────────────────────────────── */
const SEV = {
  Critical: { color: 'var(--red)', bg: 'rgba(239,68,68,0.08)', border: 'rgba(239,68,68,0.3)', Icon: AlertCircle },
  Warning:  { color: 'var(--amber)', bg: 'rgba(245,158,11,0.08)', border: 'rgba(245,158,11,0.3)', Icon: AlertTriangle },
  Healthy:  { color: 'var(--green)', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)', Icon: CheckCircle },
  Normal:   { color: 'var(--green)', bg: 'rgba(34,197,94,0.08)', border: 'rgba(34,197,94,0.3)', Icon: CheckCircle },
};

const FAULT_ICONS = {
  'Temperature': Thermometer,
  'Voltage': Zap,
  'Gas': Wind,
  'Vibration': Activity,
  'Current': Zap,
};

function getFaultIcon(type) {
  const key = Object.keys(FAULT_ICONS).find(k => type?.toLowerCase().includes(k.toLowerCase()));
  return key ? FAULT_ICONS[key] : Shield;
}

function timeAgo(ts) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return `${Math.floor(d / 1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d / 60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d / 3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en-IN');
}

function fmt(ts) {
  const d = new Date(ts);
  return { date: d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }), time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) };
}

/* ── KPI Stat Card ──────────────────────────────────────────────── */
function KpiCard({ label, value, sub, color, icon: Icon }) {
  return (
    <motion.div whileHover={{ y: -3 }}
      style={{ background: 'linear-gradient(135deg, var(--surface-2), var(--surface))', borderRadius: 16, border: `1px solid ${color}30`, borderTop: `3px solid ${color}`, padding: '18px 22px', display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{ padding: 8, borderRadius: 10, background: `${color}15`, border: `1px solid ${color}30` }}>
          <Icon size={16} color={color} />
        </div>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', letterSpacing: 1 }}>{label}</span>
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, fontFamily: 'var(--mono)', color, lineHeight: 1, textShadow: `0 0 20px ${color}40` }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: 'var(--text-4)' }}>{sub}</div>}
    </motion.div>
  );
}

/* ── Severity Heat Bar Chart (unique) ──────────────────────────── */
function FaultHeatTimeline({ faults }) {
  const buckets = useMemo(() => {
    const map = {};
    faults.forEach(f => {
      const h = new Date(f.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit' }).replace(':00', ':00');
      if (!map[h]) map[h] = { hour: h, Critical: 0, Warning: 0, Healthy: 0 };
      map[h][f.severity] = (map[h][f.severity] || 0) + 1;
    });
    return Object.values(map).slice(-12);
  }, [faults]);

  if (buckets.length === 0) return (
    <div style={{ height: 140, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', fontSize: 12 }}>
      No fault timing data
    </div>
  );

  return (
    <ResponsiveContainer width="100%" height={140}>
      <BarChart data={buckets} barSize={12} barGap={2}>
        <XAxis dataKey="hour" tick={{ fill: 'var(--text-4)', fontSize: 10 }} axisLine={false} tickLine={false} />
        <YAxis hide />
        <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 11 }} />
        <Bar dataKey="Critical" fill="var(--red)" radius={[2, 2, 0, 0]} stackId="a" />
        <Bar dataKey="Warning" fill="var(--amber)" radius={[2, 2, 0, 0]} stackId="a" />
        <Bar dataKey="Healthy" fill="var(--green)" radius={[2, 2, 0, 0]} stackId="a" />
      </BarChart>
    </ResponsiveContainer>
  );
}

/* ── Fault Timeline Card (new unique feature) ───────────────────── */
function FaultTimelineCard({ fault, isSelected, onClick }) {
  const sev = SEV[fault.severity] || SEV.Healthy;
  const FaultIcon = getFaultIcon(fault.faultType);
  const { date, time } = fmt(fault.timestamp);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      whileHover={{ x: 4 }}
      onClick={onClick}
      style={{
        display: 'flex', gap: 16, cursor: 'pointer', position: 'relative',
        paddingBottom: 16,
      }}
    >
      {/* Timeline spine */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
        <div style={{
          width: 38, height: 38, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: sev.bg, border: `2px solid ${sev.color}`,
          boxShadow: `0 0 15px ${sev.color}40`,
          flexShrink: 0, zIndex: 1,
        }}>
          <FaultIcon size={16} color={sev.color} />
        </div>
        <div style={{ width: 2, flex: 1, marginTop: 6, background: `linear-gradient(to bottom, ${sev.color}50, transparent)`, minHeight: 24 }} />
      </div>

      {/* Content Card */}
      <motion.div
        animate={{ background: isSelected ? sev.bg : 'var(--surface-2)' }}
        style={{
          flex: 1, borderRadius: 12, border: `1px solid ${isSelected ? sev.border : 'var(--border)'}`,
          padding: '12px 16px', transition: 'border 0.2s',
          boxShadow: isSelected ? `0 0 20px ${sev.color}20` : 'none',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{fault.faultType}</div>
            <div style={{ fontSize: 11, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>{date} · {time}</div>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            {fault.value && (
              <div style={{ fontFamily: 'var(--mono)', fontSize: 13, fontWeight: 700, color: sev.color }}>
                {fault.value}
              </div>
            )}
            <div style={{ fontSize: 9, fontWeight: 800, padding: '3px 8px', borderRadius: 20, background: sev.bg, color: sev.color, border: `1px solid ${sev.border}`, letterSpacing: 0.5 }}>
              {fault.severity?.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Expanded system snapshot */}
        <AnimatePresence>
          {isSelected && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              style={{ overflow: 'hidden' }}
            >
              <div style={{ marginTop: 12, paddingTop: 12, borderTop: `1px solid ${sev.border}` }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-4)', letterSpacing: 1, marginBottom: 8 }}>System Snapshot at event</div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {[
                    { k: 'ACTION', v: fault.actionTaken },
                    { k: 'V_PACK', v: fault.snapshot?.voltage ? `${fault.snapshot.voltage.toFixed(2)}V` : '—' },
                    { k: 'I_LOAD', v: fault.snapshot?.current ? `${fault.snapshot.current.toFixed(2)}A` : '—' },
                    { k: 'TEMP', v: fault.snapshot?.temperature ? `${fault.snapshot.temperature.toFixed(1)}°C` : '—' },
                    { k: 'RELAY', v: fault.actionTaken?.includes('Disconnected') ? 'OPEN' : 'CLOSED' },
                  ].map(({ k, v }) => (
                    <div key={k} style={{ background: 'var(--surface)', padding: '5px 10px', borderRadius: 6, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 800 }}>{k}</div>
                      <div style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text)', fontWeight: 700, marginTop: 2 }}>{v}</div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.div>
  );
}

/* ── Main Page ──────────────────────────────────────────────────── */
export default function FaultReports() {
  const [faults, setFaults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedFault, setSelectedFault] = useState(null);

  const fetchData = useCallback(() => {
    setLoading(true);
    Promise.all([
      fetch('/api/faults?limit=100').then(r => r.json()),
      fetch('/api/faults/summary').then(r => r.json()),
    ]).then(([f, s]) => {
      if (f.success) setFaults(f.data);
      if (s.success) setSummary(s.data);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const clearAll = async () => {
    if (!window.confirm('Clear all fault logs? This cannot be undone.')) return;
    await fetch('/api/faults', { method: 'DELETE' });
    fetchData();
  };

  const filtered = faults.filter(f => {
    const matchesSev = !filter || f.severity === filter;
    const matchesSearch = !search || f.faultType?.toLowerCase().includes(search.toLowerCase()) || f.actionTaken?.toLowerCase().includes(search.toLowerCase());
    return matchesSev && matchesSearch;
  });

  // Compute KPIs
  const critCount = faults.filter(f => f.severity === 'Critical').length;
  const warnCount = faults.filter(f => f.severity === 'Warning').length;
  const faultRate = faults.length > 1
    ? (faults.length / Math.max(1, (new Date(faults[0]?.timestamp) - new Date(faults[faults.length - 1]?.timestamp)) / 3600000)).toFixed(1)
    : '0.0';
  const mtbf = faults.length > 1
    ? Math.max(0, ((new Date(faults[0]?.timestamp) - new Date(faults[faults.length - 1]?.timestamp)) / (faults.length * 60000))).toFixed(0)
    : '∞';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Fault Event Log</h1>
          <p className="page-sub">Real-time incident timeline · Forensic snapshots · Fault rate analytics</p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} style={{ gap: 5 }}>
            <RefreshCw size={13} className={loading ? 'animate-spin-fast' : ''} /> Refresh
          </button>
          <button className="btn btn-danger btn-sm" onClick={clearAll}><Trash2 size={13} /> Clear All</button>
        </div>
      </div>

      {/* KPI Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <KpiCard label="Total Events" value={faults.length} sub="since session start" color="var(--blue)" icon={Shield} />
        <KpiCard label="Critical Faults" value={critCount} sub="requires immediate action" color="var(--red)" icon={AlertCircle} />
        <KpiCard label="Fault Rate" value={`${faultRate}/h`} sub="events per hour" color="var(--amber)" icon={TrendingDown} />
        <KpiCard label="MTBF" value={`${mtbf}m`} sub="mean time between faults" color="var(--green)" icon={Clock} />
      </div>

      {/* Main Content: Timeline + Analytics */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20, alignItems: 'start' }}>

        {/* LEFT: Fault Timeline Feed */}
        <div className="card" style={{ minHeight: 600 }}>
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Clock size={14} color="var(--yellow)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Live Incident Timeline</span>
              <span className="badge badge-gray">{filtered.length} events</span>
            </div>
            {/* Filter pills */}
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ label: 'ALL', val: '' }, { label: 'CRIT', val: 'Critical' }, { label: 'WARN', val: 'Warning' }, { label: 'OK', val: 'Healthy' }].map(s => (
                <button key={s.label} onClick={() => setFilter(s.val)}
                  style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, cursor: 'pointer', background: filter === s.val ? 'var(--yellow)' : 'var(--surface-3)', color: filter === s.val ? '#000' : 'var(--text-3)', border: 'none', transition: 'all 0.2s' }}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div style={{ padding: '12px 20px 0', position: 'relative' }}>
            <Search size={14} color="var(--text-4)" style={{ position: 'absolute', top: '50%', left: 32, transform: 'translateY(-8%)' }} />
            <input className="input" placeholder="Search faults..." value={search} onChange={e => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 32, background: 'var(--surface-3)' }} />
          </div>

          <div className="card-body" style={{ maxHeight: 600, overflowY: 'auto', paddingTop: 20 }}>
            <AnimatePresence>
              {filtered.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-4)' }}>
                  <CheckCircle size={40} color="var(--green)" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.5 }} />
                  <div style={{ fontWeight: 700, fontSize: 14 }}>No incidents found</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>All systems operating normally</div>
                </div>
              ) : (
                filtered.map((f, i) => (
                  <FaultTimelineCard
                    key={f.id ?? i}
                    fault={f}
                    isSelected={selectedFault === (f.id ?? i)}
                    onClick={() => setSelectedFault(selectedFault === (f.id ?? i) ? null : (f.id ?? i))}
                  />
                ))
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* RIGHT: Analytics Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Fault Frequency Timeline Chart — NEW UNIQUE FEATURE */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Activity size={14} color="var(--blue)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Hourly Fault Density</span>
              </div>
              <span className="badge badge-blue">Stacked</span>
            </div>
            <div className="card-body">
              <p style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 12, lineHeight: 1.5 }}>
                Temporal distribution of fault events. Identifies high-risk operational hours.
              </p>
              <FaultHeatTimeline faults={faults} />
              <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 10, fontSize: 11 }}>
                {[['Critical', 'var(--red)'], ['Warning', 'var(--amber)'], ['Normal', 'var(--green)']].map(([l, c]) => (
                  <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, color: 'var(--text-3)' }}>
                    <div style={{ width: 8, height: 8, borderRadius: 2, background: c }} />
                    {l}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Severity Breakdown */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={14} color="var(--amber)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Severity Breakdown</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Critical', count: critCount, color: 'var(--red)', total: faults.length },
                { label: 'Warning', count: warnCount, color: 'var(--amber)', total: faults.length },
                { label: 'Normal', count: faults.length - critCount - warnCount, color: 'var(--green)', total: faults.length },
              ].map(({ label, count, color, total }) => {
                const pct = total > 0 ? (count / total) * 100 : 0;
                return (
                  <div key={label}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color }}>{label}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, color, fontWeight: 800 }}>{count} <span style={{ color: 'var(--text-4)', fontWeight: 400 }}>({pct.toFixed(0)}%)</span></span>
                    </div>
                    <div style={{ height: 6, background: 'var(--surface-3)', borderRadius: 99, overflow: 'hidden' }}>
                      <motion.div
                        initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8 }}
                        style={{ height: '100%', background: color, borderRadius: 99, boxShadow: `0 0 8px ${color}` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Top Fault Types */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Zap size={14} color="var(--purple)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Top Fault Sources</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(() => {
                const counts = {};
                faults.forEach(f => { counts[f.faultType] = (counts[f.faultType] || 0) + 1; });
                return Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([type, count], i) => {
                  const FaultIcon = getFaultIcon(type);
                  return (
                    <div key={type} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 8, background: 'var(--surface-3)', border: '1px solid var(--border)' }}>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--text-4)', width: 16 }}>#{i + 1}</span>
                      <FaultIcon size={14} color="var(--yellow)" />
                      <span style={{ flex: 1, fontSize: 12, fontWeight: 700, color: 'var(--text-2)' }}>{type}</span>
                      <span style={{ fontFamily: 'var(--mono)', fontSize: 12, fontWeight: 800, color: 'var(--yellow)' }}>{count}x</span>
                    </div>
                  );
                });
              })()}
              {faults.length === 0 && <div style={{ color: 'var(--text-4)', fontSize: 12, textAlign: 'center', padding: 16 }}>No faults recorded</div>}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
