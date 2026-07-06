import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { Brain, Activity, Cpu, Zap, ShieldCheck, AlertTriangle, Sparkles, Wrench, Search } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function AIInsights({ data, history }) {
  const [trend, setTrend]   = useState([]);
  const [insight, setInsight] = useState('');
  const [loadingInsight, setLoadingInsight] = useState(false);

  const generateGeminiInsight = async () => {
    setLoadingInsight(true);
    try {
      const res = await fetch('/api/chat/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ data })
      });
      const json = await res.json();
      if (json.success) setInsight(json.data);
    } catch (e) {
      console.error(e);
    }
    setLoadingInsight(false);
  };

  useEffect(() => {
    fetch('/api/anomalies/trend?limit=60').then(r => r.json()).then(d => d.success && setTrend(d.data)).catch(() => {});
  }, []);

  const score = data?.anomalyScore ?? 0;
  const status = data?.status ?? 'Healthy';
  const statusColor = status === 'Healthy' ? 'var(--green)' : status === 'Warning' ? 'var(--amber)' : 'var(--red)';

  const trendData = trend.length > 0
    ? trend.map(r => ({ t: new Date(r.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }), score: r.anomalyScore, health: r.batteryHealth, status: r.status }))
    : history.map((h, i) => ({ t: i, score: h.anomalyScore ?? 0, health: h.batteryHealth ?? 0, status: h.status }));

  // --- Advanced Risk Calculations ---
  const tempMax = Math.max(data?.temp1 ?? 0, data?.temp2 ?? 0);
  const tempRisk = Math.max(0, Math.min(100, ((tempMax - 30) / 30) * 100));
  
  const cellMax = Math.max(data?.cell1 ?? 0, data?.cell2 ?? 0, data?.cell3 ?? 0, data?.cell4 ?? 0);
  const cellMin = Math.min(data?.cell1 ?? 4.2, data?.cell2 ?? 4.2, data?.cell3 ?? 4.2, data?.cell4 ?? 4.2);
  const cellSpread = cellMax - cellMin;
  const electricalRisk = Math.max(0, Math.min(100, (cellSpread / 0.15) * 100));
  
  const mechanicalRisk = Math.max(0, Math.min(100, ((data?.vibration ?? 0) / 3.0) * 100));
  const chemicalRisk = Math.max(0, Math.min(100, ((data?.gas ?? 0) / 400) * 100));

  const radarData = [
    { subject: 'Thermal', A: tempRisk },
    { subject: 'Electrical', A: electricalRisk },
    { subject: 'Mechanical', A: mechanicalRisk },
    { subject: 'Chemical', A: chemicalRisk }
  ];

  // Root Cause logic
  let rootCause = 'Normal Operation';
  let rcColor = 'var(--green)';
  if (score > 15) {
    const risks = [
      { name: 'Thermal Runaway Risk', val: tempRisk },
      { name: 'Cell Imbalance Fault', val: electricalRisk },
      { name: 'Structural Vibration', val: mechanicalRisk },
      { name: 'Gas / CO Emissions', val: chemicalRisk }
    ];
    risks.sort((a,b) => b.val - a.val);
    rootCause = risks[0].val > 20 ? risks[0].name : 'System Degradation';
    rcColor = statusColor;
  }

  // Predictive Maintenance (RUL) estimation
  const health = data?.batteryHealth ?? 100;
  const rulDays = Math.max(0, Math.round(health * 3.65)); // 100% health = ~365 days


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div><h1 className="page-title">AI Predictive Engine</h1><p className="page-sub">Real-time TinyML inference on edge hardware</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="badge badge-yellow"><Cpu size={12}/> STM32 MCU</div>
          <div className="badge badge-blue"><Zap size={12}/> TensorFlow Lite</div>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        
        {/* Node Topology Visualization */}
        <div className="card" style={{ background: 'var(--surface-2)', borderColor: 'var(--yellow-border)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(227, 37, 38, 0.2)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Neural Network Data Flow</span>
            <span className="badge" style={{ background: 'var(--yellow-bg)', color: 'var(--yellow)', border: 'none' }}><Activity size={10} style={{ marginRight: 4 }}/> INFERENCE ACTIVE</span>
          </div>
          
          <div className="card-body" style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
            <div style={{ position: 'relative', width: 800, height: 360, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              
              {/* Input Layer */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20, zIndex: 10 }}>
              {[
                { label: 'Voltage (V1-V4)', val: `${(data?.cell1 ?? 0).toFixed(2)}V`, color: 'var(--blue)' },
                { label: 'Current (I)', val: `${(data?.current ?? 0).toFixed(1)}A`, color: 'var(--blue)' },
                { label: 'Temperature (T1, T2)', val: `${(data?.temp1 ?? 0).toFixed(1)}°C, ${(data?.temp2 ?? 0).toFixed(1)}°C`, color: 'var(--red)' },
                { label: 'Gas (VOC)', val: `${data?.gas ?? 0}ppm`, color: 'var(--green)' },
                { label: 'Vibration (V)', val: `${(data?.vibration ?? 0).toFixed(1)}g`, color: 'var(--yellow)' }
              ].map((input, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{input.label}</div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'var(--text-2)', fontWeight: 600 }}>{input.val}</div>
                  </div>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: input.color, boxShadow: `0 0 10px ${input.color}` }} />
                </div>
              ))}
              </div>

              {/* Hidden Layer (Brain) */}
              <div style={{ zIndex: 10, position: 'relative' }}>
                 <div style={{ 
                   width: 100, height: 100, borderRadius: '50%', background: 'rgba(255, 204, 0, 0.1)',
                   border: '2px solid var(--yellow)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                   boxShadow: '0 0 30px rgba(255, 204, 0, 0.3)', animation: 'pulse 2s infinite'
                 }}>
                   <Brain size={40} color="var(--yellow)" />
                 </div>
                 <div style={{ position: 'absolute', bottom: -30, left: '50%', transform: 'translateX(-50%)', whiteSpace: 'nowrap', fontSize: 10, color: 'var(--text-4)' }}>
                   Dense Layer • 32 Nodes
                 </div>
              </div>

              {/* Output Layer */}
              <div style={{ zIndex: 10 }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                   <div style={{ width: 18, height: 18, borderRadius: '50%', background: statusColor, boxShadow: `0 0 15px ${statusColor}`, animation: 'blink 1s infinite' }} />
                   <div>
                      <div style={{ fontSize: 11, color: 'var(--text-4)' }}>Anomaly Confidence</div>
                      <div style={{ fontSize: 32, fontFamily: 'var(--mono)', color: statusColor, fontWeight: 800 }}>{score.toFixed(1)}%</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 4 }}>
                        {status === 'Healthy' ? <ShieldCheck size={14} color={statusColor}/> : <AlertTriangle size={14} color={statusColor}/>}
                        <span style={{ fontSize: 12, color: statusColor, fontWeight: 700, textTransform: 'uppercase' }}>{status} STATE</span>
                      </div>
                   </div>
                 </div>
              </div>

              {/* Animated SVG connecting lines */}
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 0 }}>
                 {/* Lines from inputs to brain */}
                 <path d="M 160 80 Q 250 180 350 180" fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" className="current-line-flow" />
                 <path d="M 160 140 Q 250 180 350 180" fill="none" stroke="rgba(59, 130, 246, 0.3)" strokeWidth="2" className="current-line-flow" />
                 <path d="M 160 210 Q 250 180 350 180" fill="none" stroke="rgba(245, 158, 11, 0.3)" strokeWidth="2" className="current-line-flow" />
                 <path d="M 160 280 Q 250 180 350 180" fill="none" stroke="rgba(16, 185, 129, 0.3)" strokeWidth="2" className="current-line-flow" />
                 <path d="M 160 320 Q 250 180 350 180" fill="none" stroke="rgba(252, 211, 77, 0.3)" strokeWidth="2" className="current-line-flow" />
                 
                 {/* Line from brain to output */}
                 <path d="M 450 180 Q 550 180 650 180" fill="none" stroke="var(--yellow)" strokeWidth="3" strokeDasharray="5,5" className="current-line-flow" />
              </svg>
            </div>
          </div>
        </div>

        {/* 3 Metrics Cards Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
           <div className="card" style={{ flex: 1 }}>
              <div className="card-header"><span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Model Details</span></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Inference Time</div>
                  <div style={{ fontSize: 16, fontFamily: 'var(--mono)', color: 'var(--text-2)', fontWeight: 700 }}>~8.4 ms</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Model Size</div>
                  <div style={{ fontSize: 16, fontFamily: 'var(--mono)', color: 'var(--text-2)', fontWeight: 700 }}>24.2 KB</div>
                </div>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--text-4)' }}>Sensor Polling</div>
                  <div style={{ fontSize: 16, fontFamily: 'var(--mono)', color: 'var(--text-2)', fontWeight: 700 }}>2000 ms</div>
                </div>
              </div>
           </div>

           {/* Root Cause Analyzer */}
           <div className="card" style={{ flex: 1, borderColor: score > 15 ? rcColor : 'var(--border)' }}>
              <div className="card-header">
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Root Cause Analyzer</span>
                <Search size={14} color={score > 15 ? rcColor : 'var(--text-3)'} />
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center', flex: 1, padding: 16 }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Primary Driver</div>
                <div style={{ fontSize: 14, fontWeight: 800, color: rcColor, textAlign: 'center', textShadow: score > 15 ? `0 0 10px ${rcColor}55` : 'none' }}>
                  {score > 15 ? `⚠️ ${rootCause}` : `✅ ${rootCause}`}
                </div>
              </div>
           </div>

           {/* Predictive Maintenance (RUL) */}
           <div className="card" style={{ flex: 1 }}>
              <div className="card-header">
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Maintenance RUL</span>
                <Wrench size={14} color="var(--blue)" />
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'center', justifyContent: 'center', flex: 1 }}>
                <div style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Est. Time to Maintenance</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--blue)', fontFamily: 'var(--mono)' }}>{rulDays}</div>
                  <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>Days</div>
                </div>
              </div>
           </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        {/* Full width chart at bottom */}
        <div className="card">
          <div className="card-header">
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Anomaly Confidence Timeline</div>
            <span className={`badge ${status === 'Healthy' ? 'badge-green' : status === 'Warning' ? 'badge-amber' : 'badge-red'}`}>{status}</span>
          </div>
          <div className="card-body">
            <div style={{ height: 250 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="t" stroke="var(--text-4)" fontSize={10} tickMargin={10} minTickGap={30} />
                  <YAxis stroke="var(--text-4)" fontSize={10} tickFormatter={(val) => `${val}%`} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '12px' }}
                    itemStyle={{ color: 'var(--text-2)' }}
                  />
                  <ReferenceLine y={50} stroke="var(--red)" strokeDasharray="3 3" />
                  <ReferenceLine y={15} stroke="var(--amber)" strokeDasharray="3 3" />
                  <Area type="monotone" dataKey="score" stroke={statusColor} fill={`url(#scoreGradient-${statusColor})`} strokeWidth={2} />
                  <defs>
                    <linearGradient id={`scoreGradient-${statusColor}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={statusColor} stopOpacity={0.3} />
                      <stop offset="95%" stopColor={statusColor} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Radar Chart Risk Vector */}
        <div className="card">
          <div className="card-header">
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Risk Vector Analysis</span>
          </div>
          <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 250 }}>
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                <PolarGrid stroke="var(--border)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 600 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Risk" dataKey="A" stroke="var(--yellow)" fill="var(--yellow)" fillOpacity={0.3} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Gemini Analysis Module */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <div className="card-header">
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Gemini Edge Analysis</span>
          <Sparkles size={14} color="var(--yellow)" />
        </div>
        <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>Generate a comprehensive NLP report of current battery state.</div>
            <button 
              onClick={generateGeminiInsight} 
              disabled={loadingInsight} 
              style={{
                padding: '10px 20px', borderRadius: 4, background: 'var(--yellow)', color: '#000', 
                border: 'none', fontWeight: 700, fontSize: 13, cursor: loadingInsight ? 'wait' : 'pointer',
                display: 'flex', alignItems: 'center', gap: 8, transition: 'all 0.2s'
              }}
            >
              {loadingInsight ? <Activity size={16} className="animate-spin" /> : <Brain size={16} />}
              {loadingInsight ? 'Analyzing Battery Data...' : 'Generate Real-Time Report'}
            </button>
          </div>
          {insight && (
            <div style={{ 
              padding: 20, background: 'var(--surface-2)', borderRadius: 8, 
              fontSize: 13, color: 'var(--text-2)', lineHeight: 1.6, border: '1px solid var(--border)',
              boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
            }}>
              <ReactMarkdown
                components={{
                  p: ({node, ...props}) => <p style={{ marginBottom: 12 }} {...props} />,
                  ul: ({node, ...props}) => <ul style={{ paddingLeft: 20, marginBottom: 12, listStyleType: 'disc' }} {...props} />,
                  li: ({node, ...props}) => <li style={{ marginBottom: 6 }} {...props} />,
                  strong: ({node, ...props}) => <strong style={{ color: 'var(--text)', fontWeight: 700 }} {...props} />
                }}
              >
                {insight}
              </ReactMarkdown>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
