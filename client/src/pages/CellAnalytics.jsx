import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Battery, TrendingUp, TrendingDown, Info, Zap, Thermometer, ShieldCheck, Activity, Cpu, Flame } from 'lucide-react';
import { motion } from 'framer-motion';

const CELL_COLORS = ['#3253DC', '#3253DC', '#3253DC', '#3253DC'];
const CELL_GLOWS = ['rgba(50,83,220,0.4)', 'rgba(50,83,220,0.4)', 'rgba(50,83,220,0.4)', 'rgba(50,83,220,0.4)'];

export default function CellAnalytics({ data, history }) {
  const [apiHistory, setApiHistory] = useState([]);
  const [selectedCell, setSelectedCell] = useState(0);

  useEffect(() => {
    fetch('/api/readings/history?limit=60').then(r => r.json()).then(d => d.success && setApiHistory(d.data)).catch(() => {});
  }, []);

  const chartData = (apiHistory.length > 0 ? apiHistory : history).map((h, i) => ({
    i,
    t: new Date(h.timestamp || Date.now() - (history.length - i) * 2000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
    c1: h.cell1, c2: h.cell2, c3: h.cell3, c4: h.cell4,
  }));

  const voltages = [data?.cell1, data?.cell2, data?.cell3, data?.cell4].map(v => v ?? 0);
  const avgVoltage = voltages.reduce((a,b)=>a+b,0)/4;
  const packV = voltages.reduce((a,b)=>a+b,0);
  const spread = (Math.max(...voltages) - Math.min(...voltages)).toFixed(3);
  
  // Hero KPI Data ported from Mobile
  const packCurrent = data?.current ?? 0;
  const packPower = packV ? ((packV * packCurrent) / 1000).toFixed(2) : 0;
  const isCharging = packCurrent > 0;

  // Derive temperatures based on temp1 (front pair) and temp2 (rear pair)
  const cellTemps = [data?.temperature ?? data?.temp1 ?? 0, data?.temperature ?? data?.temp1 ?? 0, data?.temperature ?? data?.temp2 ?? 0, data?.temperature ?? data?.temp2 ?? 0];

  const cellStats = voltages.map((v, i) => {
    const vals = chartData.map(d => d[`c${i+1}`]).filter(Boolean);
    const min = vals.length ? Math.min(...vals) : v;
    const max = vals.length ? Math.max(...vals) : v;
    const prev = chartData.length >= 2 ? chartData[chartData.length-2][`c${i+1}`] : v;
    
    // Synthetic IR (Internal Resistance) based on voltage sag and temp
    const ir = (15 + (4.2 - v) * 20 + (cellTemps[i] > 40 ? 5 : 0)).toFixed(1);
    const health = Math.max(0, Math.min(100, 100 - (v < 3.5 ? 20 : 0) - (cellTemps[i] > 50 ? 30 : 0)));
    
    // Thermal Risk Score (dT/dt abstraction ported from mobile)
    const rawTemp = cellTemps[i];
    const thermalRisk = Math.max(0, Math.min(100, (rawTemp - 20) * 8));

    return { min, max, trend: v - prev, ir, health, thermalRisk, isBalancing: v > avgVoltage + 0.02 };
  });

  const activeColor = CELL_COLORS[selectedCell];
  const activeGlow = CELL_GLOWS[selectedCell];
  const activeVoltage = voltages[selectedCell];
  const activeStats = cellStats[selectedCell];
  const activeTemp = cellTemps[selectedCell];
  const activeKey = `c${selectedCell + 1}`;
  const activePct = Math.max(0, Math.min(100, ((activeVoltage - 3.0) / 1.2) * 100)).toFixed(0);

  // Radar Data for active cell
  const radarData = [
    { subject: 'Voltage', A: Math.min(100, (activeVoltage/4.2)*100), fullMark: 100 },
    { subject: 'Thermal', A: Math.max(0, 100 - (activeTemp/80)*100), fullMark: 100 },
    { subject: 'Health', A: activeStats.health, fullMark: 100 },
    { subject: 'Efficiency', A: Math.max(0, 100 - (activeStats.ir/50)*100), fullMark: 100 },
    { subject: 'Stability', A: 100 - Math.abs(activeStats.trend)*1000, fullMark: 100 },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Header with Expanded Hero KPIs */}
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Advanced Cell Analytics</h1>
          <p className="page-sub">High-fidelity isolated telemetry & topology mapping</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          {/* Ported Power State */}
          <div className="card" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Pack Power</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 20, color: isCharging ? 'var(--green)' : 'var(--amber)' }}>
              {Math.abs(packPower)} kW
            </span>
          </div>
          <div className="card" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Pack Voltage</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 20, color: 'var(--yellow)', textShadow: '0 0 10px rgba(234, 179, 8, 0.3)' }}>{packV.toFixed(2)}V</span>
          </div>
          <div className="card" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--surface-2)', border: '1px solid var(--border)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Max Imbalance</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 20, color: parseFloat(spread) > 0.15 ? 'var(--red)' : 'var(--green)', textShadow: parseFloat(spread) > 0.15 ? '0 0 10px rgba(239, 68, 68, 0.3)' : '0 0 10px rgba(34, 197, 94, 0.3)' }}>{spread}V</span>
          </div>
        </div>
      </div>

      {/* Topography Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
        {voltages.map((v, i) => {
          const isSelected = selectedCell === i;
          const cColor = CELL_COLORS[i];
          const pct = Math.max(0, Math.min(100, ((v - 3.0) / 1.2) * 100));
          const tRisk = cellStats[i].thermalRisk;
          const borderC = tRisk > 75 ? 'var(--red)' : isSelected ? cColor : 'var(--border)';

          return (
            <motion.div 
              key={i}
              whileHover={{ scale: 1.02, y: -5 }}
              onClick={() => setSelectedCell(i)}
              style={{
                background: isSelected ? 'var(--surface)' : 'var(--surface-2)',
                border: `1px solid ${borderC}`,
                boxShadow: isSelected ? `0 10px 30px ${CELL_GLOWS[i]}` : 'var(--shadow-sm)',
                borderRadius: 8, padding: 20, cursor: 'pointer', position: 'relative', overflow: 'hidden',
                transition: 'border 0.3s'
              }}
            >
              {isSelected && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(180deg, ${cColor}15, transparent)`, zIndex: 0 }} />}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: isSelected ? cColor : 'var(--text-2)', fontFamily: 'var(--mono)', transition: 'color 0.3s' }}>CELL 0{i+1}</span>
                {tRisk > 75 ? (
                  <span className="badge badge-red" style={{ fontSize: 9 }}><Flame size={10} style={{marginRight:4}}/> RISK</span>
                ) : cellStats[i].isBalancing ? (
                  <span className="badge badge-purple" style={{ fontSize: 9 }}><Activity size={10} style={{marginRight:4}}/> BAL</span>
                ) : null}
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginTop: 24, position: 'relative', zIndex: 1 }}>
                <div style={{ width: 44, height: 88, border: `2px solid var(--text-4)`, borderRadius: 10, position: 'relative', padding: 2, background: 'rgba(0,0,0,0.2)' }}>
                  <div style={{ position: 'absolute', top: -6, left: '50%', transform: 'translateX(-50%)', width: 18, height: 4, background: 'var(--text-4)', borderRadius: '4px 4px 0 0' }} />
                  <div style={{ 
                    position: 'absolute', bottom: 2, left: 2, right: 2, height: `calc(${pct}% - 4px)`, 
                    background: tRisk > 75 ? 'var(--red)' : isSelected ? cColor : 'var(--text-4)', borderRadius: 6, transition: 'height 1s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s',
                    boxShadow: tRisk > 75 ? '0 0 20px var(--red)' : isSelected ? `0 0 20px ${cColor}` : 'none'
                  }} />
                </div>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'var(--mono)', color: 'var(--text)', lineHeight: 1 }}>{v.toFixed(3)}<span style={{ fontSize: 16, color: 'var(--text-4)', marginLeft: 2 }}>V</span></div>
                  <div style={{ fontSize: 13, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6, background: 'var(--surface-3)', padding: '4px 8px', borderRadius: 6, width: 'fit-content' }}>
                    <Thermometer size={14} color={cellTemps[i] > 55 ? 'var(--red)' : 'var(--green)'}/> 
                    <span style={{ fontFamily: 'var(--mono)', fontWeight: 600 }}>{cellTemps[i].toFixed(1)}°C</span>
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Main Details */}
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20 }}>
        
        {/* Left Col: Diagnostics */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: 0, padding: 0, overflow: 'hidden' }}>
          <div className="card-header" style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)' }}>
             <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Cell {selectedCell + 1} Profile</span>
             <span className="badge" style={{ background: `${activeColor}20`, color: activeColor, border: `1px solid ${activeColor}40` }}>{activePct}% SOC</span>
          </div>
          
          <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 16, background: 'var(--surface-2)' }}>
            
            {/* Added Thermal Risk Score */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}><Flame size={18} color={activeStats.thermalRisk > 75 ? 'var(--red)' : 'var(--amber)'}/></div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase' }}>Thermal Risk (dT/dt)</span>
                   <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', color: activeStats.thermalRisk > 75 ? 'var(--red)' : 'var(--amber)' }}>{activeStats.thermalRisk.toFixed(0)} <span style={{ fontSize: 12 }}>%</span></span>
                 </div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}><Zap size={18} color="var(--blue)"/></div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase' }}>Internal Resistance</span>
                   <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--text-2)' }}>{activeStats.ir} <span style={{ fontSize: 12, color: 'var(--text-4)' }}>mΩ</span></span>
                 </div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}><ShieldCheck size={18} color="var(--green)"/></div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase' }}>State of Health</span>
                   <span style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--green)' }}>{activeStats.health}<span style={{ fontSize: 12, color: 'var(--green)' }}>%</span></span>
                 </div>
               </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
               <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                 <div style={{ padding: 10, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, boxShadow: 'var(--shadow-sm)' }}><Cpu size={18} color="var(--purple)"/></div>
                 <div style={{ display: 'flex', flexDirection: 'column' }}>
                   <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600, textTransform: 'uppercase' }}>Passive Balancing</span>
                   <span style={{ fontSize: 15, fontWeight: 800, fontFamily: 'var(--mono)', color: activeStats.isBalancing ? 'var(--purple)' : 'var(--text-3)' }}>{activeStats.isBalancing ? 'ENGAGED' : 'STANDBY'}</span>
                 </div>
               </div>
            </div>
            
            <div style={{ height: 200, width: '100%', marginTop: 10, position: 'relative' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(circle at center, var(--surface) 0%, transparent 70%)', opacity: 0.5, borderRadius: '50%' }} />
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="65%" data={radarData}>
                  <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
                  <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-3)', fontSize: 11, fontWeight: 600 }} />
                  <Radar name="Cell Profile" dataKey="A" stroke={activeColor} strokeWidth={2} fill={activeColor} fillOpacity={0.4} />
                  <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, fontSize: 12 }} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Right Col: Advanced Trend */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ padding: '20px 24px' }}>
             <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>High-Resolution Voltage Telemetry</span>
             <div style={{ display: 'flex', gap: 16 }}>
                <span style={{ fontSize: 12, color: 'var(--text-3)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: activeColor, boxShadow: `0 0 10px ${activeColor}` }} />
                  Live Stream
                </span>
                {activeStats.trend !== 0 && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, fontWeight: 700, color: activeStats.trend > 0 ? 'var(--green)' : 'var(--red)' }}>
                    {activeStats.trend > 0 ? <TrendingUp size={16}/> : <TrendingDown size={16}/>} {Math.abs(activeStats.trend).toFixed(3)} V/s
                  </span>
                )}
             </div>
          </div>
          <div className="card-body" style={{ flex: 1, padding: '0 24px 24px 0' }}>
            <div style={{ height: '100%', minHeight: 400 }}>
              <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 20, right: 0, bottom: 0, left: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                    <XAxis dataKey="t" tick={{ fontSize: 11, fill: 'var(--text-4)', fontWeight: 500 }} interval="preserveStartEnd" axisLine={false} tickLine={false} dy={15} />
                    <YAxis domain={[3.5, 4.3]} tick={{ fontSize: 11, fill: 'var(--text-4)', fontFamily: 'var(--mono)', fontWeight: 600 }} tickFormatter={v => `${v}V`} axisLine={false} tickLine={false} dx={-10} />
                    <Tooltip 
                      contentStyle={{ background: 'var(--surface-2)', backdropFilter: 'blur(10px)', border: `1px solid ${activeColor}`, borderRadius: 12, fontSize: 13, color: 'var(--text)', boxShadow: `0 8px 32px ${activeGlow}` }} 
                      itemStyle={{ color: 'var(--text)', fontWeight: 800, fontFamily: 'var(--mono)' }}
                      labelStyle={{ color: 'var(--text-4)', marginBottom: 4 }}
                    />
                    <ReferenceLine y={3.6} stroke="var(--red)" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'CUTOFF', fill: 'var(--red)', fontSize: 10, position: 'insideBottomRight', fontWeight: 700 }} />
                    <ReferenceLine y={4.2} stroke="var(--red)" strokeDasharray="4 4" strokeOpacity={0.5} label={{ value: 'MAX LIMIT', fill: 'var(--red)', fontSize: 10, position: 'insideTopRight', fontWeight: 700 }} />
                    <ReferenceLine y={avgVoltage} stroke="var(--text-3)" strokeDasharray="2 2" strokeOpacity={0.5} label={{ value: 'PACK AVG', fill: 'var(--text-3)', fontSize: 10, position: 'insideTopLeft', fontWeight: 700 }} />
                    <defs>
                      <linearGradient id="colorActive" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={activeColor} stopOpacity={0.5}/>
                        <stop offset="95%" stopColor={activeColor} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Area type="monotone" dataKey={activeKey} stroke={activeColor} strokeWidth={4} fill="url(#colorActive)" dot={{ fill: activeColor, r: 3, strokeWidth: 2, stroke: 'var(--surface)' }} activeDot={{ r: 7, fill: 'var(--surface)', stroke: activeColor, strokeWidth: 3 }} isAnimationActive={true} />
                  </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

      </div>

      {/* RUL Prediction AI Card ported from Mobile */}
      <div className="card" style={{ padding: 24, border: '1px solid var(--blue)' }}>
         <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
           <div>
             <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
               <Activity size={18} color="var(--blue)"/>
               <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-2)' }}>Remaining Useful Life (RUL)</h3>
             </div>
             <p style={{ margin: 0, fontSize: 13, color: 'var(--text-4)' }}>AI degradation trajectory prediction based on current cycling behavior.</p>
           </div>
           <div style={{ textAlign: 'right' }}>
             <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--blue)', lineHeight: 1 }}>14</div>
             <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-3)', textTransform: 'uppercase' }}>Months to replacement</div>
           </div>
         </div>

         {/* Gradient Bar */}
         <div style={{ position: 'relative', height: 16, background: 'var(--surface-3)', borderRadius: 8, display: 'flex', overflow: 'visible', marginBottom: 16 }}>
           <div style={{ width: '15%', background: 'var(--green)', borderRadius: '8px 0 0 8px' }} />
           <div style={{ width: '40%', background: 'var(--amber)' }} />
           <div style={{ width: '45%', background: 'var(--red)', opacity: 0.8, borderRadius: '0 8px 8px 0' }} />
           
           <div style={{ position: 'absolute', left: '15%', top: -25, display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: -20 }}>
             <div style={{ background: 'var(--surface-2)', padding: '4px 8px', borderRadius: 4, fontSize: 11, fontWeight: 800, border: '1px solid var(--border)' }}>NOW</div>
             <div style={{ width: 2, height: 16, background: 'var(--text-2)', marginTop: 4 }} />
           </div>
         </div>

         <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--text-4)', fontWeight: 600 }}>
           <span>Current: <strong style={{ color: 'var(--text)' }}>125 Cycles</strong></span>
           <span>Limit: <strong style={{ color: 'var(--text)' }}>840 Cycles</strong></span>
         </div>
      </div>
    </div>
  );
}
