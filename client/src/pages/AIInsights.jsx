import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Brain, Activity, Cpu, Zap, RadioReceiver, ShieldCheck, AlertTriangle, Sparkles } from 'lucide-react';
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div className="page-header">
        <div><h1 className="page-title">AI Predictive Engine</h1><p className="page-sub">Real-time TinyML inference on edge hardware</p></div>
        <div style={{ display: 'flex', gap: 8 }}>
          <div className="badge badge-purple"><Cpu size={12}/> STM32 MCU</div>
          <div className="badge badge-blue"><Zap size={12}/> TensorFlow Lite</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 20 }}>
        
        {/* Node Topology Visualization */}
        <div className="card" style={{ background: '#0b0f19', borderColor: 'var(--purple-border)' }}>
          <div className="card-header" style={{ borderBottom: '1px solid rgba(124, 58, 237, 0.2)' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Neural Network Data Flow</span>
            <span className="badge" style={{ background: 'var(--purple-bg)', color: 'var(--purple)', border: 'none' }}><Activity size={10} style={{ marginRight: 4 }}/> INFERENCE ACTIVE</span>
          </div>
          
          <div className="card-body" style={{ position: 'relative', height: '360px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px' }}>
            
            {/* Input Layer */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, zIndex: 10 }}>
              {[
                { label: 'Voltage (V1-V4)', val: `${(data?.cell1 ?? 4).toFixed(2)}V`, color: '#3b82f6' },
                { label: 'Current (I)', val: `${(data?.current ?? 0).toFixed(1)}A`, color: '#3b82f6' },
                { label: 'Temperature (T1, T2)', val: `${(data?.temp1 ?? 0).toFixed(1)}°C, ${(data?.temp2 ?? 0).toFixed(1)}°C`, color: '#f59e0b' },
                { label: 'Gas (VOC)', val: `${data?.gas ?? 0}ppm`, color: '#10b981' },
                { label: 'Vibration (V)', val: `${(data?.vibration ?? 0).toFixed(1)}g`, color: '#fcd34d' }
              ].map((input, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-4)' }}>{input.label}</div>
                    <div style={{ fontSize: 13, fontFamily: 'var(--mono)', color: 'white', fontWeight: 600 }}>{input.val}</div>
                  </div>
                  <div style={{ width: 14, height: 14, borderRadius: '50%', background: input.color, boxShadow: `0 0 10px ${input.color}` }} />
                </div>
              ))}
            </div>

            {/* Hidden Layer (Brain) */}
            <div style={{ zIndex: 10, position: 'relative' }}>
               <div style={{ 
                 width: 100, height: 100, borderRadius: '50%', background: 'rgba(124, 58, 237, 0.1)',
                 border: '2px solid var(--purple)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                 boxShadow: '0 0 30px rgba(124, 58, 237, 0.3)', animation: 'pulse 2s infinite'
               }}>
                 <Brain size={40} color="var(--purple)" />
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
               <path d="M 450 180 Q 550 180 650 180" fill="none" stroke="var(--purple)" strokeWidth="3" strokeDasharray="5,5" className="current-line-flow" />
            </svg>
          </div>
        </div>

        {/* Side Metrics */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
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
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 8, fontSize: 11, color: 'var(--text-3)', lineHeight: 1.5 }}>
                  The TinyML model runs directly on the edge hardware, providing immediate anomaly detection without cloud latency.
                </div>
              </div>
           </div>

           {/* Gemini Insights Card */}
           <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <div className="card-header">
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Gemini Analysis</span>
                <Sparkles size={14} color="var(--purple)" />
              </div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12, flex: 1 }}>
                <button 
                  onClick={generateGeminiInsight} 
                  disabled={loadingInsight} 
                  style={{
                    padding: '10px 14px', borderRadius: 8, background: 'var(--purple)', color: '#fff', 
                    border: 'none', fontWeight: 600, fontSize: 12, cursor: loadingInsight ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all 0.2s'
                  }}
                >
                  {loadingInsight ? <Activity size={14} className="animate-spin" /> : <Brain size={14} />}
                  {loadingInsight ? 'Analyzing Battery Data...' : 'Generate Real-Time Report'}
                </button>
                {insight && (
                  <div style={{ 
                    padding: 14, background: 'var(--surface-2)', borderRadius: 8, 
                    fontSize: 12, color: 'var(--text-2)', overflowY: 'auto', 
                    maxHeight: 220, lineHeight: 1.6, border: '1px solid var(--border)',
                    boxShadow: 'inset 0 2px 10px rgba(0,0,0,0.1)'
                  }}>
                    <ReactMarkdown
                      components={{
                        p: ({node, ...props}) => <p style={{ marginBottom: 8 }} {...props} />,
                        ul: ({node, ...props}) => <ul style={{ paddingLeft: 16, marginBottom: 8 }} {...props} />,
                        li: ({node, ...props}) => <li style={{ marginBottom: 4 }} {...props} />,
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

      </div>

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
                <XAxis dataKey="t" tick={{ fontSize: 10, fill: 'var(--text-4)' }} interval="preserveStartEnd" />
                <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: 'var(--text-4)' }} tickFormatter={v => `${v}%`} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} formatter={(v) => [`${v?.toFixed(1)}%`, 'Score']} labelFormatter={() => ''} />
                <ReferenceLine y={20} stroke="var(--amber)" strokeDasharray="4 4" label={{ value: 'Warn 20%', position: 'insideTopRight', fontSize: 9, fill: 'var(--amber)' }} />
                <ReferenceLine y={50} stroke="var(--red)" strokeDasharray="4 4" label={{ value: 'Critical 50%', position: 'insideTopRight', fontSize: 9, fill: 'var(--red)' }} />
                <defs><linearGradient id="aiArea" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--purple)" stopOpacity={0.15}/><stop offset="95%" stopColor="var(--purple)" stopOpacity={0}/></linearGradient></defs>
                <Area type="monotone" dataKey="score" stroke="var(--purple)" strokeWidth={2} fill="url(#aiArea)" dot={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

    </div>
  );
}
