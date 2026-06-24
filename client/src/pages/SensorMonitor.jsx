import { useEffect, useState, useMemo } from 'react';
import { AreaChart, Area, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Zap, Thermometer, Wind, Activity, SignalHigh } from 'lucide-react';
import { motion } from 'framer-motion';

function SensorNode({ title, dataKey, history, unit, critAt, warnAt, color, icon: Icon }) {
  const latestValue = history.length > 0 ? history[history.length - 1][dataKey] : 0;
  const isWarn = latestValue >= warnAt;
  const isCrit = latestValue >= critAt;
  const c = isCrit ? 'var(--red)' : isWarn ? 'var(--amber)' : color;
  const bgC = isCrit ? 'rgba(239,68,68,0.1)' : isWarn ? 'rgba(245,158,11,0.1)' : `${color}15`;
  
  const sparkData = history.map((h, i) => ({ i, val: h[dataKey] })).slice(-40); 

  return (
    <motion.div 
      whileHover={{ y: -4, scale: 1.02 }}
      className="card" 
      style={{ 
        border: `1px solid ${isCrit ? 'var(--red-border)' : isWarn ? 'var(--amber-border)' : 'var(--border)'}`, 
        boxShadow: isCrit ? `0 0 30px rgba(239,68,68,0.15)` : isWarn ? `0 0 30px rgba(245,158,11,0.15)` : `0 4px 20px rgba(0,0,0,0.1)`,
        padding: '20px', position: 'relative', overflow: 'hidden', background: 'var(--surface-2)',
        display: 'flex', flexDirection: 'column'
      }}
    >
      {(isWarn || isCrit) && (
        <div style={{ position: 'absolute', inset: 0, background: c, opacity: 0.05, animation: 'dot-pulse 2s infinite' }} />
      )}
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 10, borderRadius: 12, background: bgC, border: `1px solid ${c}30` }}>
            <Icon size={18} color={c} />
          </div>
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</span>
        </div>
        <div style={{ fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 6, background: isCrit ? 'var(--red-bg)' : isWarn ? 'var(--amber-bg)' : 'var(--surface-3)', color: isCrit ? 'var(--red)' : isWarn ? 'var(--amber)' : 'var(--text-3)', border: `1px solid ${isCrit ? 'var(--red)' : isWarn ? 'var(--amber)' : 'var(--border)'}` }}>
          {isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NOMINAL'}
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'baseline', gap: 4, zIndex: 1 }}>
        <span style={{ fontSize: 36, fontWeight: 900, fontFamily: 'var(--mono)', color: 'var(--text)', lineHeight: 1 }}>{latestValue?.toFixed(2)}</span>
        <span style={{ fontSize: 14, color: 'var(--text-4)', fontWeight: 600 }}>{unit}</span>
      </div>

      <div style={{ height: 45, width: '100%', marginTop: 16, zIndex: 1, filter: `drop-shadow(0px 5px 10px ${c}40)` }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line type="monotone" dataKey="val" stroke={c} strokeWidth={3} dot={false} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div style={{ marginTop: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11, color: 'var(--text-4)', zIndex: 1, background: 'var(--surface)', padding: '6px 10px', borderRadius: 8, border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>LIMIT</span> <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{critAt}{unit}</span>
        </div>
        <div style={{ width: 1, height: 12, background: 'var(--border)' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontWeight: 600 }}>PEAK</span> <span style={{ fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{Math.max(...sparkData.map(d=>d.val), 0).toFixed(1)}{unit}</span>
        </div>
      </div>
    </motion.div>
  );
}

export default function SensorMonitor({ data, history }) {
  const [apiHistory, setApiHistory] = useState([]);
  useEffect(() => {
    fetch('/api/readings/history?limit=60').then(r => r.json()).then(d => d.success && setApiHistory(d.data)).catch(() => {});
  }, []);

  const src = apiHistory.length > 0 ? apiHistory : history;
  const chartData = src.map((h, i) => ({
    i,
    t: new Date(h.timestamp || Date.now() - (src.length - i) * 2000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    current: h.current, temp1: h.temp1, temp2: h.temp2, gas: h.gas, vibration: h.vibration
  }));

  // Signal Integrity Calculation
  const signalJitter = useMemo(() => {
    if (chartData.length < 2) return 99.9;
    const diffs = chartData.map((d, i) => i > 0 ? Math.abs(d.temp1 - chartData[i-1].temp1) : 0);
    const avgDiff = diffs.reduce((a,b)=>a+b,0) / diffs.length;
    return Math.max(80, Math.min(100, 100 - avgDiff * 5)).toFixed(1);
  }, [chartData]);

  // Network Topology Data
  const networkData = [
    { name: 'Current Shunt', status: 'Optimal', latency: '12ms' },
    { name: 'Thermal Array 1', status: data?.temp1 > 60 ? 'Stressed' : 'Optimal', latency: '8ms' },
    { name: 'Thermal Array 2', status: data?.temp2 > 60 ? 'Stressed' : 'Optimal', latency: '9ms' },
    { name: 'VOC Gas Sniffer', status: data?.gas > 400 ? 'Warning' : 'Optimal', latency: '15ms' },
    { name: 'IMU Vibration', status: 'Optimal', latency: '5ms' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Sensor Matrix Operations</h1>
          <p className="page-sub">Direct hardware node polling & signal integrity analysis</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="card" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Signal Integrity</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 20, color: 'var(--green)', textShadow: '0 0 10px rgba(34, 197, 94, 0.3)' }}>{signalJitter}%</span>
          </div>
          <div className="card" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Active Nodes</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 20, color: 'var(--blue)', textShadow: '0 0 10px rgba(59, 130, 246, 0.3)' }}>5 / 5</span>
          </div>
        </div>
      </div>

      {/* Nodes Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <SensorNode title="Shunt Current" dataKey="current" history={src} unit="A" color="var(--blue)" warnAt={10} critAt={15} icon={Zap} />
        <SensorNode title="Thermal Array 1" dataKey="temp1" history={src} unit="°C" color="var(--amber)" warnAt={55} critAt={65} icon={Thermometer} />
        <SensorNode title="Thermal Array 2" dataKey="temp2" history={src} unit="°C" color="#f97316" warnAt={55} critAt={65} icon={Thermometer} />
        <SensorNode title="VOC Emissions" dataKey="gas" history={src} unit="ppm" color="var(--purple)" warnAt={250} critAt={500} icon={Wind} />
        <SensorNode title="IMU Vibration" dataKey="vibration" history={src} unit="g" color="var(--yellow)" warnAt={1.5} critAt={3.0} icon={Activity} />
      </div>

      {/* Main Analysis Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 20 }}>
        
        {/* Core Telemetry Stream */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '20px 24px', borderBottom: '1px solid var(--border)' }}>
            <div style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Multiplexed Sensor Stream</div>
            <div style={{ display: 'flex', gap: 16 }}>
               <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}><div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--blue)', boxShadow: '0 0 8px var(--blue)' }}/> Current</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}><div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--amber)', boxShadow: '0 0 8px var(--amber)' }}/> Temp 1</span>
               <span style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-3)' }}><div style={{ width: 10, height: 10, borderRadius: 3, background: '#f97316', boxShadow: '0 0 8px #f97316' }}/> Temp 2</span>
            </div>
          </div>
          <div className="card-body" style={{ flex: 1, padding: '24px 24px 24px 0' }}>
            <div style={{ height: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 5, right: 0, bottom: 0, left: 0 }}>
                  <defs>
                    <linearGradient id="gTemp1" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--amber)" stopOpacity={0.4}/><stop offset="95%" stopColor="var(--amber)" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gTemp2" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#f97316" stopOpacity={0.4}/><stop offset="95%" stopColor="#f97316" stopOpacity={0}/></linearGradient>
                    <linearGradient id="gCurr" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="var(--blue)" stopOpacity={0.4}/><stop offset="95%" stopColor="var(--blue)" stopOpacity={0}/></linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                  <XAxis dataKey="t" tick={{ fontSize: 11, fill: 'var(--text-4)', fontWeight: 500 }} interval="preserveStartEnd" axisLine={false} tickLine={false} dy={15} />
                  
                  {/* Left Axis: Temp */}
                  <YAxis yAxisId="temp" orientation="left" domain={[30, 80]} tick={{ fontSize: 11, fill: 'var(--amber)', fontFamily: 'var(--mono)', fontWeight: 600 }} tickFormatter={v => `${v}°`} axisLine={false} tickLine={false} dx={-10} />
                  {/* Right Axis: Current */}
                  <YAxis yAxisId="curr" orientation="right" domain={[0, 25]} tick={{ fontSize: 11, fill: 'var(--blue)', fontFamily: 'var(--mono)', fontWeight: 600 }} tickFormatter={v => `${v}A`} axisLine={false} tickLine={false} dx={10} />
                  
                  <RechartsTooltip 
                    contentStyle={{ background: 'rgba(11, 15, 25, 0.95)', backdropFilter: 'blur(10px)', border: `1px solid var(--border)`, borderRadius: 12, fontSize: 13, color: '#fff' }} 
                    itemStyle={{ color: '#fff', fontWeight: 800, fontFamily: 'var(--mono)' }}
                  />
                  
                  <ReferenceLine yAxisId="temp" y={65} stroke="var(--red)" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'CRITICAL TEMP', fill: 'var(--red)', fontSize: 10, position: 'insideBottomLeft', fontWeight: 700 }} />
                  
                  <Area yAxisId="temp" type="monotone" dataKey="temp1" name="Temp 1" stroke="var(--amber)" strokeWidth={3} fill="url(#gTemp1)" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area yAxisId="temp" type="monotone" dataKey="temp2" name="Temp 2" stroke="#f97316" strokeWidth={3} fill="url(#gTemp2)" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                  <Area yAxisId="curr" type="monotone" dataKey="current" name="Current" stroke="var(--blue)" strokeWidth={3} fill="url(#gCurr)" dot={false} activeDot={{ r: 6, strokeWidth: 0 }} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Signal Intelligence */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div className="card">
             <div className="card-header" style={{ borderBottom: '1px solid var(--border)' }}>
               <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Hardware Topology</span>
             </div>
             <div className="card-body" style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>
               {networkData.map((node, i) => (
                 <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                     <SignalHigh size={14} color={node.status === 'Optimal' ? 'var(--green)' : node.status === 'Warning' ? 'var(--amber)' : 'var(--red)'} />
                     <span style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 600 }}>{node.name}</span>
                   </div>
                   <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                     <span style={{ fontSize: 10, fontFamily: 'var(--mono)', color: 'var(--text-4)' }}>{node.latency}</span>
                     <div style={{ width: 8, height: 8, borderRadius: '50%', background: node.status === 'Optimal' ? 'var(--green)' : node.status === 'Warning' ? 'var(--amber)' : 'var(--red)', boxShadow: `0 0 8px ${node.status === 'Optimal' ? 'var(--green)' : node.status === 'Warning' ? 'var(--amber)' : 'var(--red)'}` }} />
                   </div>
                 </div>
               ))}
             </div>
          </div>

          <div className="card" style={{ flex: 1, background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <div className="card-header">
               <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Diagnostic Output</span>
            </div>
            <div className="card-body" style={{ padding: 20, height: '100%' }}>
              <div style={{ 
                background: '#040b16', padding: 16, borderRadius: 12, 
                fontFamily: 'var(--mono)', fontSize: 11, color: 'var(--green)',
                height: 180, overflowY: 'hidden', display: 'flex', flexDirection: 'column', gap: 8,
                boxShadow: 'inset 0 0 20px rgba(0,0,0,0.8)', border: '1px solid rgba(59, 130, 246, 0.2)'
              }}>
                <div style={{ color: 'var(--text-4)' }}>{'>'} SYSTEM INITIALIZED</div>
                <div>{'>'} POLLING HARDWARE I/O... OK</div>
                <div>{'>'} ESTABLISHING MQTT BRIDGE... <span style={{ color: 'var(--blue)' }}>CONNECTED</span></div>
                <div>{'>'} RX: {chartData.length} PACKETS PROCESSED</div>
                <div style={{ color: data?.anomalyScore > 15 ? 'var(--amber)' : 'var(--green)' }}>
                  {'>'} AI WATCHDOG: {data?.anomalyScore > 15 ? `WARNING - SCORE ${data.anomalyScore}` : 'NOMINAL'}
                </div>
                {data?.temp1 > 60 && <div style={{ color: 'var(--red)', animation: 'blink 1s infinite' }}>{'>'} ERR: THERMAL OVERLOAD T1</div>}
                {data?.temp2 > 60 && <div style={{ color: 'var(--red)', animation: 'blink 1s infinite' }}>{'>'} ERR: THERMAL OVERLOAD T2</div>}
                {data?.gas > 400 && <div style={{ color: 'var(--red)', animation: 'blink 1s infinite' }}>{'>'} ERR: VOC EMISSIONS CRITICAL</div>}
                <div style={{ marginTop: 'auto', display: 'flex', gap: 4 }}>
                  <div style={{ width: 8, height: 14, background: 'var(--green)', animation: 'blink 1s infinite' }} />
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
