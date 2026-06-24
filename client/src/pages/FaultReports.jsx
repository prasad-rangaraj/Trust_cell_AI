import React, { useEffect, useState, useCallback } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { AlertTriangle, AlertCircle, CheckCircle, Trash2, RefreshCw, Filter, Search, Calendar, ChevronDown, ChevronUp } from 'lucide-react';

const SEV_COLOR = { Critical: 'var(--red)', Warning: 'var(--amber)', Healthy: 'var(--green)', Normal: 'var(--green)' };
const SEV_CLS   = { Critical: 'badge-red', Warning: 'badge-amber', Healthy: 'badge-green', Normal: 'badge-green' };
const PIE_COLORS = ['var(--green)', 'var(--amber)', 'var(--red)'];

function timeAgo(ts) {
  const d = Date.now() - new Date(ts).getTime();
  if (d < 60000) return `${Math.floor(d/1000)}s ago`;
  if (d < 3600000) return `${Math.floor(d/60000)}m ago`;
  if (d < 86400000) return `${Math.floor(d/3600000)}h ago`;
  return new Date(ts).toLocaleDateString('en-IN');
}

export default function FaultReports() {
  const [faults, setFaults] = useState([]);
  const [summary, setSummary] = useState(null);
  const [filter, setFilter] = useState('');
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [expandedRow, setExpandedRow] = useState(null);

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
    const matchesSearch = !search || f.faultType.toLowerCase().includes(search.toLowerCase()) || f.actionTaken.toLowerCase().includes(search.toLowerCase());
    return matchesSev && matchesSearch;
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div><h1 className="page-title">Fault Reports</h1><p className="page-sub">High-density event log & forensic analysis</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-secondary btn-sm" onClick={fetchData} style={{ gap: 5 }}>
            <RefreshCw size={13} className={loading ? 'animate-spin-fast' : ''} /> Refresh
          </button>
          <button className="btn btn-danger btn-sm" onClick={clearAll}><Trash2 size={13} /> Clear All</button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: 20, alignItems: 'start' }}>
        
        {/* Left Sidebar: Filters & Summary */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
           {/* Filters */}
           <div className="card">
             <div className="card-header"><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Filters</span></div>
             <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
               <div style={{ position: 'relative' }}>
                 <Search size={14} color="var(--text-4)" style={{ position: 'absolute', top: '50%', left: 10, transform: 'translateY(-50%)' }} />
                 <input className="input" placeholder="Search events..." value={search} onChange={e => setSearch(e.target.value)} style={{ width: '100%', paddingLeft: 30 }} />
               </div>
               <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase' }}>Severity</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {[
                      { label: 'All Severities', val: '' },
                      { label: 'Critical', val: 'Critical', color: 'var(--red)' },
                      { label: 'Warning', val: 'Warning', color: 'var(--amber)' },
                      { label: 'Normal', val: 'Healthy', color: 'var(--green)' }
                    ].map(s => (
                      <button key={s.label} className="btn" 
                              onClick={() => setFilter(s.val)}
                              style={{ 
                                justifyContent: 'flex-start', background: filter === s.val ? 'var(--surface-2)' : 'transparent', 
                                border: `1px solid ${filter === s.val ? 'var(--border-2)' : 'transparent'}`,
                                color: s.color || 'var(--text-2)'
                              }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color || 'var(--text-4)' }}/>
                        {s.label}
                      </button>
                    ))}
                  </div>
               </div>
             </div>
           </div>

           {/* Pie Chart Summary */}
           <div className="card">
             <div className="card-header"><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Distribution</span></div>
             <div className="card-body">
               {summary?.bySeverity ? (
                 <div style={{ height: 160 }}>
                   <ResponsiveContainer width="100%" height="100%">
                     <PieChart>
                       <Pie data={summary.bySeverity.filter(d => d.value > 0)} cx="50%" cy="50%" innerRadius={40} outerRadius={60} dataKey="value" stroke="none">
                         {summary.bySeverity.map((e, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                       </Pie>
                       <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                     </PieChart>
                   </ResponsiveContainer>
                 </div>
               ) : (
                 <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)' }}>No data</div>
               )}
               <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 12, fontSize: 11 }}>
                 <span style={{ color: 'var(--red)', fontWeight: 700 }}>{summary?.bySeverity?.find(s => s.name === 'Critical')?.value || 0} Crit</span>
                 <span style={{ color: 'var(--amber)', fontWeight: 700 }}>{summary?.bySeverity?.find(s => s.name === 'Warning')?.value || 0} Warn</span>
                 <span style={{ color: 'var(--green)', fontWeight: 700 }}>{summary?.bySeverity?.find(s => s.name === 'Healthy')?.value || 0} Norm</span>
               </div>
             </div>
           </div>
        </div>

        {/* Right Area: Advanced Data Grid */}
        <div className="card" style={{ flex: 1, minHeight: 600 }}>
          <div className="card-header" style={{ padding: '12px 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
               <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Event Log</span>
               <span className="badge badge-gray">{filtered.length} records found</span>
            </div>
          </div>
          
          <div style={{ overflowX: 'auto', maxHeight: '600px', overflowY: 'auto' }}>
            <table className="data-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
              <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--surface-2)', boxShadow: '0 1px 0 var(--border)' }}>
                <tr>
                  <th style={{ width: '40px' }}></th>
                  <th style={{ width: '140px' }}><div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Calendar size={12}/> Timestamp</div></th>
                  <th>Event Type</th>
                  <th>Severity</th>
                  <th>Trigger Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-4)', padding: 60 }}>
                    <CheckCircle size={32} color="var(--green)" style={{ display: 'block', margin: '0 auto 12px', opacity: 0.5 }} />
                    No events match current filters.
                  </td></tr>
                ) : filtered.map((f, i) => {
                  const isExpanded = expandedRow === f.id;
                  const sevColor = SEV_COLOR[f.severity] || 'var(--text-3)';
                  return (
                    <React.Fragment key={f.id ?? i}>
                      <tr 
                        onClick={() => setExpandedRow(isExpanded ? null : f.id)}
                        style={{ cursor: 'pointer', background: isExpanded ? 'var(--surface-2)' : 'transparent', borderLeft: `3px solid ${sevColor}` }}
                      >
                        <td style={{ color: 'var(--text-4)', paddingLeft: 10 }}>
                          {isExpanded ? <ChevronUp size={14}/> : <ChevronDown size={14}/>}
                        </td>
                        <td>
                          <div className="mono" style={{ color: 'var(--text-2)', fontSize: 11 }}>{new Date(f.timestamp).toLocaleDateString()}</div>
                          <div className="mono" style={{ color: 'var(--text-4)', fontSize: 10 }}>{new Date(f.timestamp).toLocaleTimeString()}</div>
                        </td>
                        <td style={{ fontWeight: 600, color: 'var(--text-2)' }}>{f.faultType}</td>
                        <td><span className={`badge ${SEV_CLS[f.severity] || 'badge-gray'}`} style={{ fontSize: 10 }}>{f.severity}</span></td>
                        <td className="mono" style={{ color: sevColor, fontWeight: 700 }}>{f.value || '—'}</td>
                        <td style={{ color: 'var(--text-3)', fontSize: 12 }}>{f.actionTaken}</td>
                      </tr>
                      {/* Expanded Details Row */}
                      {isExpanded && (
                        <tr style={{ background: 'var(--surface-3)' }}>
                          <td colSpan={6} style={{ padding: '16px 24px', borderLeft: `3px solid ${sevColor}` }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                               <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase' }}>System Snapshot at time of event</div>
                               <div style={{ display: 'flex', gap: 20, fontFamily: 'var(--mono)', fontSize: 12 }}>
                                  <div style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-4)', marginRight: 8 }}>V_PACK:</span> {f.snapshot?.voltage ? f.snapshot.voltage.toFixed(2) : '--'} V
                                  </div>
                                  <div style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-4)', marginRight: 8 }}>I_LOAD:</span> {f.snapshot?.current ? f.snapshot.current.toFixed(2) : '--'} A
                                  </div>
                                  <div style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-4)', marginRight: 8 }}>TEMP:</span> {f.snapshot?.temperature ? f.snapshot.temperature.toFixed(1) : '--'} °C
                                  </div>
                                  <div style={{ background: 'var(--surface)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                                    <span style={{ color: 'var(--text-4)', marginRight: 8 }}>RELAY:</span> {f.actionTaken.includes('Disconnected') ? 'OPEN' : 'CLOSED'}
                                  </div>
                               </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
