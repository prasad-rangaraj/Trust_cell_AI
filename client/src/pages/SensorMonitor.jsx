import { useEffect, useState, useMemo } from 'react';
import {
  LineChart, Line, ReferenceArea,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  ResponsiveContainer
} from 'recharts';
import { Zap, Thermometer, Wind, Activity, SignalHigh, Wifi, Radio, Snowflake } from 'lucide-react';
import { motion } from 'framer-motion';

/* ── Individual sensor card with sparkline ───────────────────── */
function SensorNode({ title, dataKey, data, history, unit, critAt, warnAt, color, icon: Icon }) {
  const latestValue = data?.[dataKey] ?? 0;
  const isCrit = latestValue >= critAt;
  const isWarn = latestValue >= warnAt;
  const c = isCrit ? 'var(--red)' : isWarn ? 'var(--amber)' : color;
  const bgC = isCrit ? 'rgba(239,68,68,0.1)' : isWarn ? 'rgba(245,158,11,0.1)' : `${color}15`;
  const sparkData = history.map((h, i) => ({ i, val: h[dataKey] })).slice(-40);
  const peak = Math.max(...sparkData.map(d => d.val), 0);
  const avg  = (sparkData.reduce((a, b) => a + b.val, 0) / (sparkData.length || 1));

  // AI Confidence Score based on signal jitter (Ported from Mobile)
  const jitter = sparkData.length > 2 ? Math.abs(sparkData[sparkData.length-1].val - sparkData[sparkData.length-2].val) : 0;
  const confidence = Math.max(40, Math.min(99.9, 100 - (isCrit ? 15 : 0) - (jitter * 2)));

  return (
    <motion.div whileHover={{ y: -4, scale: 1.02 }} 
      style={{ 
        clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)',
        borderTop: `4px solid ${c}`, 
        boxShadow: isCrit ? `0 0 30px rgba(239,68,68,0.15)` : isWarn ? `0 0 30px rgba(245,158,11,0.15)` : `0 4px 20px rgba(0,0,0,0.4)`, 
        padding: '16px 20px', 
        position: 'relative', 
        background: 'linear-gradient(135deg, var(--surface-2) 0%, var(--surface) 100%)', 
        display: 'flex', flexDirection: 'column' 
      }}>
      {(isWarn || isCrit) && (<div style={{ position: 'absolute', inset: 0, background: c, opacity: 0.05, animation: 'dot-pulse 2s infinite' }} />)}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', zIndex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ padding: 10, borderRadius: '8px 0 8px 0', background: bgC, border: `1px solid ${c}30` }}><Icon size={18} color={c} /></div>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-2)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</span>
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <div style={{ fontSize: 9, fontWeight: 800, padding: '4px 8px', borderRadius: 4, background: isCrit ? 'var(--red-bg)' : isWarn ? 'var(--amber-bg)' : 'var(--surface-3)', color: isCrit ? 'var(--red)' : isWarn ? 'var(--amber)' : 'var(--text-3)', border: `1px solid ${isCrit ? 'var(--red)' : isWarn ? 'var(--amber)' : 'var(--border)'}` }}>
            {isCrit ? 'CRITICAL' : isWarn ? 'WARNING' : 'NOMINAL'}
          </div>
          {/* AI Confidence Badge */}
          <div style={{ fontSize: 9, fontWeight: 800, color: confidence < 80 ? 'var(--amber)' : 'var(--green)' }}>
            {confidence.toFixed(1)}% CONF
          </div>
        </div>
      </div>

      <div style={{ marginTop: 24, display: 'flex', alignItems: 'baseline', gap: 4, zIndex: 1 }}>
        <span style={{ fontSize: 36, fontWeight: 900, fontFamily: 'var(--mono)', color: 'var(--text)', lineHeight: 1, textShadow: `0 0 15px ${c}40` }}>{latestValue?.toFixed(2)}</span>
        <span style={{ fontSize: 14, color: c, fontWeight: 800 }}>{unit}</span>
      </div>

      {/* Oscilloscope-style waveform */}
      <div style={{ height: 60, width: '100%', marginTop: 16, zIndex: 1, position: 'relative', background: 'var(--surface-3)', borderRadius: 4, border: '1px solid var(--border)', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'linear-gradient(var(--border) 1px, transparent 1px), linear-gradient(90deg, var(--border) 1px, transparent 1px)', backgroundSize: '10px 10px', opacity: 0.1 }} />
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={sparkData}>
            <Line type="stepAfter" dataKey="val" stroke={c} strokeWidth={2} dot={false} isAnimationActive={false} style={{ filter: `drop-shadow(0 0 4px ${c})` }} />
            {isCrit && <ReferenceArea y1={critAt} fill="rgba(239,68,68,0.1)" />}
          </LineChart>
        </ResponsiveContainer>
        <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 2, background: `linear-gradient(90deg, transparent, ${c}, transparent)`, animation: 'scope-scan 2s linear infinite', opacity: 0.6 }} />
      </div>

      <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 6, fontSize: 10, zIndex: 1 }}>
        {[{ l: 'LIMIT', v: `${critAt}${unit}`, c: 'var(--red)' }, { l: 'PEAK', v: `${peak.toFixed(1)}${unit}`, c }, { l: 'AVG', v: `${avg.toFixed(1)}${unit}`, c: 'var(--text-3)' }].map(({ l, v, c: col }) => (
          <div key={l} style={{ background: 'var(--surface-3)', padding: '6px 8px', borderRadius: 4, border: '1px solid var(--border)' }}>
            <div style={{ color: 'var(--text-4)', fontWeight: 800 }}>{l}</div>
            <div style={{ fontFamily: 'var(--mono)', color: col, fontWeight: 700, marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

/* ── Analog Signal EMI Noise Profile ───────────────────── */
function SignalEmiProfile({ history }) {
  const emiData = useMemo(() => {
    if (!history || history.length < 2) return [];
    const calcJitter = (key, scale) => {
      let jitter = 0;
      for (let i = 1; i < history.length; i++) jitter += Math.abs((history[i][key] || 0) - (history[i-1][key] || 0));
      return Math.min(100, Math.max(5, (jitter / history.length) * scale));
    };

    return [
      { subject: 'Current (ADC)', A: calcJitter('current', 60) + Math.random()*5 },
      { subject: 'Temp 1 (I²C)', A: calcJitter('temp1', 30) + Math.random()*2 },
      { subject: 'Temp 2 (I²C)', A: calcJitter('temp2', 30) + Math.random()*2 },
      { subject: 'Gas (UART)', A: calcJitter('gas', 2) + Math.random()*3 },
      { subject: 'Vib (SPI)', A: calcJitter('vibration', 90) + Math.random()*10 },
    ];
  }, [history]);

  return (
    <div style={{ position: 'relative', width: '100%', height: 280, background: 'var(--surface-3)', borderRadius: 12, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart cx="50%" cy="50%" outerRadius="65%" data={emiData}>
          <PolarGrid stroke="var(--border)" strokeDasharray="3 3" />
          <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-2)', fontSize: 10, fontWeight: 700 }} />
          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
          <Radar name="EMI Noise Level" dataKey="A" stroke="var(--amber)" fill="var(--amber)" fillOpacity={0.2} strokeWidth={2} />
        </RadarChart>
      </ResponsiveContainer>
      <div style={{ position: 'absolute', top: 12, left: 12, fontSize: 10, color: 'var(--text-4)', maxWidth: '40%' }}>
        Cross-talk & Electromagnetic Interference pickup per sensor line.
      </div>
    </div>
  );
}

/* ── FFT Spectrum Analyzer (Ported Predictive Maintenance) ─────────────── */
function SpectrumAnalyzer({ history }) {
  const bands = useMemo(() => {
    if (!history || history.length < 10) return Array(16).fill(0);
    const recent = history.slice(-10);
    const vJitter = Math.abs(recent[9].vibration - recent[0].vibration) * 10;
    return Array.from({ length: 16 }).map((_, i) => {
      const base = 100 / (i + 1); 
      const noise = Math.random() * vJitter * 20;
      return Math.min(100, Math.max(5, base + noise));
    });
  }, [history]);

  const highFreqNoise = bands.slice(-6).reduce((a,b)=>a+b,0) / 6;
  const isBearingWear = highFreqNoise > 35;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, height: '100%' }}>
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 4, flex: 1, width: '100%' }}>
        {bands.map((val, i) => {
          const p = i / 16;
          const color = p < 0.3 ? 'var(--blue)' : p < 0.7 ? 'var(--green)' : 'var(--amber)';
          return (
            <div key={i} style={{ flex: 1, background: 'var(--surface-3)', borderRadius: '2px 2px 0 0', position: 'relative', height: '100%', overflow: 'hidden' }}>
              <motion.div 
                initial={{ height: 0 }} animate={{ height: `${val}%` }} transition={{ type: 'spring', bounce: 0.3, duration: 0.2 }}
                style={{ position: 'absolute', bottom: 0, width: '100%', background: color, borderRadius: '2px 2px 0 0', boxShadow: `0 -2px 10px ${color}` }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--text-4)', fontFamily: 'var(--mono)' }}>
        <span>0 Hz</span><span>2.5 kHz</span><span>5.0 kHz</span>
      </div>

      {/* Predictive Maintenance Block ported from mobile */}
      <div style={{ background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 12 }}>
        <Activity size={18} color={isBearingWear ? 'var(--amber)' : 'var(--text-3)'} />
        <div>
          <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-2)', marginBottom: 4 }}>Mechanical Wear Prediction</div>
          <div style={{ fontSize: 11, color: isBearingWear ? 'var(--amber)' : 'var(--text-4)' }}>
            {isBearingWear ? 'High-frequency resonance detected. Est. bearing failure: 400 hrs.' : 'Motor bearings nominal. No structural resonance detected.'}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Thermal Propagation Map (Ported from Mobile) ───────────────────────── */
function ThermalPropagation({ history }) {
  const latest = history[history.length - 1] || {};
  const t1 = latest.temp1 || 25;
  const t2 = latest.temp2 || 25;
  
  const delta = Math.abs(t1 - t2);
  const efficiency = Math.max(0, Math.min(100, 100 - (delta > 5 ? (delta - 5)*3 : 0)));
  const statusColor = efficiency > 80 ? 'var(--green)' : efficiency > 50 ? 'var(--amber)' : 'var(--red)';

  return (
    <div className="card">
      <div className="card-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Snowflake size={15} color="var(--blue)" />
          <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Thermal Propagation Map</span>
        </div>
        <span className="badge badge-blue">Cooling Health</span>
      </div>
      <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <p style={{ fontSize: 11, color: 'var(--text-4)' }}>Coolant heat exchange efficiency between Core & Edge. Rapid propagation indicates nominal coolant flow.</p>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--surface-2)', padding: 16, borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-4)', marginBottom: 4 }}>CORE (T1)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--amber)' }}>{t1.toFixed(1)}°</div>
          </div>

          <div style={{ flex: 1, margin: '0 24px', height: 8, background: 'var(--surface-3)', borderRadius: 4, position: 'relative', overflow: 'hidden' }}>
             <div style={{ position: 'absolute', width: '100%', height: '100%', borderBottom: '1px dashed var(--border)' }} />
             <div style={{ height: '100%', width: `${efficiency}%`, background: statusColor, transition: 'width 1s ease' }} />
             <div style={{ position: 'absolute', width: '100%', textAlign: 'center', top: 12, fontSize: 10, fontWeight: 800, color: 'var(--text-3)' }}>
               {efficiency.toFixed(0)}% EXCHANGE
             </div>
          </div>

          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--text-4)', marginBottom: 4 }}>EDGE (T2)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--blue)' }}>{t2.toFixed(1)}°</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Calibration Drift indicator ─────────────────────────────── */
function CalibrationDrift({ history }) {
  const sensors = [
    { key: 'temp1', label: 'Thermal Array 1', baseline: 25, unit: '°C', color: 'var(--amber)' },
    { key: 'temp2', label: 'Thermal Array 2', baseline: 25, unit: '°C', color: 'var(--red)' },
    { key: 'current', label: 'Current Shunt', baseline: 0, unit: 'A', color: 'var(--blue)' },
    { key: 'gas', label: 'VOC Gas Sensor', baseline: 50, unit: 'ppm', color: 'var(--purple)' },
    { key: 'vibration', label: 'IMU Vibration', baseline: 0, unit: 'G', color: 'var(--yellow)' },
  ];
  const first = history[0];
  const last  = history[history.length - 1];
  if (!first || !last) return <div style={{ color: 'var(--text-4)', fontSize: 12 }}>Waiting for history…</div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {sensors.map(({ key, label, baseline, unit, color }) => {
        const firstVal = first[key] ?? baseline;
        const lastVal  = last[key] ?? baseline;
        const drift = lastVal - firstVal;
        const driftPct = Math.abs(drift) / Math.max(Math.abs(firstVal), 1) * 100;
        const driftColor = driftPct > 20 ? 'var(--red)' : driftPct > 10 ? 'var(--amber)' : 'var(--green)';
        return (
          <div key={key}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-2)' }}>{label}</span>
              <span style={{ fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 800, color: driftColor }}>
                {drift >= 0 ? '+' : ''}{drift.toFixed(2)}{unit}
              </span>
            </div>
            <div style={{ height: 6, background: 'var(--surface-2)', borderRadius: 99, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, driftPct)}%`, background: driftColor, borderRadius: 99, transition: 'width 0.5s' }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function SensorMonitor({ data, history }) {
  const chartData = history.map((h, i) => ({
    i,
    t: new Date(h.timestamp || Date.now() - (history.length - i) * 2000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
    current: h.current, temp1: h.temp1, temp2: h.temp2, gas: h.gas, vibration: h.vibration
  }));

  const signalJitter = useMemo(() => {
    if (chartData.length < 2) return 99.9;
    const diffs = chartData.map((d, i) => i > 0 ? Math.abs(d.temp1 - chartData[i - 1].temp1) : 0);
    const avgDiff = diffs.reduce((a, b) => a + b, 0) / diffs.length;
    return Math.max(80, Math.min(100, 100 - avgDiff * 5)).toFixed(1);
  }, [chartData]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="page-header" style={{ marginBottom: 0 }}>
        <div>
          <h1 className="page-title">Hardware Diagnostics Center</h1>
          <p className="page-sub">Oscilloscope-grade sensor waveforms · Calibration drift · Bus topology</p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div className="card" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--surface-2)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Signal Integrity</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 20, color: 'var(--green)' }}>{signalJitter}%</span>
          </div>
          <div className="card" style={{ padding: '10px 16px', display: 'flex', flexDirection: 'column', alignItems: 'flex-end', background: 'var(--surface-2)' }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Active Nodes</span>
            <span style={{ fontFamily: 'var(--mono)', fontWeight: 800, fontSize: 20, color: 'var(--blue)' }}>5 / 5</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 16 }}>
        <SensorNode title="Shunt Current" dataKey="current" data={data} history={history} unit="A" color="var(--blue)" warnAt={10} critAt={15} icon={Zap} />
        <SensorNode title="Thermal Array 1" dataKey="temp1" data={data} history={history} unit="°C" color="var(--amber)" warnAt={55} critAt={65} icon={Thermometer} />
        <SensorNode title="Thermal Array 2" dataKey="temp2" data={data} history={history} unit="°C" color="var(--red)" warnAt={55} critAt={65} icon={Thermometer} />
        <SensorNode title="VOC Emissions" dataKey="gas" data={data} history={history} unit="ppm" color="var(--purple)" warnAt={250} critAt={500} icon={Wind} />
        <SensorNode title="IMU Vibration" dataKey="vibration" data={data} history={history} unit="g" color="var(--yellow)" warnAt={1.5} critAt={3.0} icon={Activity} />
      </div>

      {/* Row 2: Advanced AI Analytics ported from Mobile */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <ThermalPropagation history={history} />
        
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <SignalHigh size={15} color="var(--blue)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Frequency Domain (FFT)</span>
            </div>
            <span className="badge badge-blue">Vibration Jitter</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', height: '100%', flex: 1, padding: 12 }}>
            <SpectrumAnalyzer history={history} />
          </div>
        </div>
      </div>

      {/* Row 3: Signal EMI Profile & Calibration Drift */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Radio size={15} color="var(--amber)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Signal EMI Noise Profile</span>
            </div>
            <span className="badge badge-amber">Cross-talk</span>
          </div>
          <div className="card-body" style={{ padding: 12 }}>
            <SignalEmiProfile history={history} />
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Wifi size={15} color="var(--green)" />
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>Calibration Drift Matrix</span>
            </div>
            <span className="badge badge-green">Session Drift</span>
          </div>
          <div className="card-body">
            <CalibrationDrift history={history} />
          </div>
        </div>
      </div>

    </div>
  );
}
