import { useEffect, useState, useMemo, useRef } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip as RechartsTooltip, ResponsiveContainer, ZAxis,
  AreaChart, Area, Brush, ReferenceLine, LineChart, Line, Label
} from 'recharts';
import { FlaskConical, TrendingDown, Crosshair, GitBranch, BarChart2, Timer } from 'lucide-react';

/* ── Reusable section panel ─────────────────────────────────── */
const Panel = ({ title, icon: Icon, badge, children, style }) => (
  <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8, overflow: 'hidden', display: 'flex', flexDirection: 'column', ...style }}>
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', background: 'var(--surface-2)', borderBottom: '2px solid var(--yellow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <Icon size={15} color="var(--yellow)" />
        <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', letterSpacing: 0.5, textTransform: 'uppercase' }}>{title}</span>
      </div>
      {badge && <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--yellow)', border: '1px solid var(--yellow-border)', background: 'var(--yellow-bg)', padding: '2px 8px', borderRadius: 99, letterSpacing: 1 }}>{badge}</span>}
    </div>
    <div style={{ flex: 1, padding: 16 }}>{children}</div>
  </div>
);

/* ── Sensor Correlation Matrix ─────────────────────────────── */
function CorrelationMatrix({ history }) {
  const keys = ['temp1', 'temp2', 'current', 'gas', 'vibration'];
  const labels = ['T1', 'T2', 'I', 'GAS', 'VIB'];

  const matrix = useMemo(() => {
    if (history.length < 5) return null;
    return keys.map(kA => keys.map(kB => {
      if (kA === kB) return 1;
      const vA = history.map(h => h[kA] ?? 0);
      const vB = history.map(h => h[kB] ?? 0);
      const mA = vA.reduce((a, b) => a + b, 0) / vA.length;
      const mB = vB.reduce((a, b) => a + b, 0) / vB.length;
      const num = vA.reduce((s, a, i) => s + (a - mA) * (vB[i] - mB), 0);
      const den = Math.sqrt(vA.reduce((s, a) => s + (a - mA) ** 2, 0) * vB.reduce((s, b) => s + (b - mB) ** 2, 0));
      return den === 0 ? 0 : parseFloat((num / den).toFixed(2));
    }));
  }, [history]);

  if (!matrix) return <div style={{ color: 'var(--text-4)', fontSize: 12, padding: 20 }}>Collecting data for correlation analysis…</div>;

  const getColor = (v) => {
    if (v >= 0.7) return 'rgba(239, 68, 68, 0.8)';
    if (v >= 0.4) return 'rgba(245, 158, 11, 0.7)';
    if (v >= 0.1) return 'rgba(34, 197, 94, 0.5)';
    if (v >= -0.1) return 'rgba(100, 100, 120, 0.3)';
    if (v >= -0.4) return 'rgba(59, 130, 246, 0.5)';
    return 'rgba(139, 92, 246, 0.7)';
  };

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: `60px repeat(${keys.length}, 1fr)`, gap: 4, alignItems: 'center' }}>
        <div />
        {labels.map(l => <div key={l} style={{ textAlign: 'center', fontSize: 11, fontWeight: 800, color: 'var(--text-3)', fontFamily: 'var(--mono)' }}>{l}</div>)}
        {matrix.map((row, i) => ([
          <div key={`lbl-${i}`} style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-3)', fontFamily: 'var(--mono)', textAlign: 'right', paddingRight: 8 }}>{labels[i]}</div>,
          ...row.map((val, j) => (
            <div key={`${i}-${j}`} style={{
              height: 52, borderRadius: 6, background: getColor(val),
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 2,
              cursor: 'default', border: i === j ? '2px solid var(--yellow)' : '1px solid var(--border)'
            }} title={`${labels[i]} vs ${labels[j]}: ${val}`}>
              <span style={{ fontSize: 14, fontWeight: 900, color: '#fff', fontFamily: 'var(--mono)' }}>{val}</span>
            </div>
          ))
        ]))}
      </div>
      <div style={{ display: 'flex', gap: 12, marginTop: 14, fontSize: 10, flexWrap: 'wrap' }}>
        {[{ l: '≥0.7 Strong+', c: 'rgba(239,68,68,0.8)' }, { l: '0.4–0.7 Mod+', c: 'rgba(245,158,11,0.7)' }, { l: '0–0.4 Weak+', c: 'rgba(34,197,94,0.5)' }, { l: '~0 None', c: 'rgba(100,100,120,0.3)' }, { l: '<0 Neg', c: 'rgba(59,130,246,0.5)' }].map(({ l, c }) => (
          <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: c }} />
            <span style={{ color: 'var(--text-4)', fontWeight: 600 }}>{l}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Cycle Degradation Projector ───────────────────────────── */
function DegradationProjector({ data }) {
  const health = data?.batteryHealth ?? 100;
  // Project degradation: assume 0.002% per cycle at 2s polling
  const degradationRatePerCycle = 0.002;
  const eolThreshold = 80;
  const cyclesTo80 = Math.round((health - eolThreshold) / degradationRatePerCycle);

  const projData = Array.from({ length: 20 }, (_, i) => {
    const cycles = i * Math.round(cyclesTo80 / 20);
    return { cycle: cycles, projected: Math.max(eolThreshold - 5, health - cycles * degradationRatePerCycle) };
  });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', gap: 16 }}>
        <div style={{ flex: 1, background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Cycles to 80% (EOL)</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: 'var(--amber)', fontFamily: 'var(--mono)', marginTop: 4 }}>{cyclesTo80.toLocaleString()}</div>
        </div>
        <div style={{ flex: 1, background: 'var(--surface-2)', padding: '12px 16px', borderRadius: 8, border: '1px solid var(--border)' }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: 1 }}>Current SoH</div>
          <div style={{ fontSize: 28, fontWeight: 900, color: health > 90 ? 'var(--green)' : 'var(--amber)', fontFamily: 'var(--mono)', marginTop: 4 }}>{health.toFixed(1)}%</div>
        </div>
      </div>
      <div style={{ height: 200 }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={projData} margin={{ top: 10, right: 20, bottom: 10, left: 0 }}>
            <defs>
              <linearGradient id="gradHealth" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--yellow)" stopOpacity={0.4} />
                <stop offset="95%" stopColor="var(--yellow)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
            <XAxis dataKey="cycle" stroke="var(--text-4)" tick={{ fontSize: 10, fill: 'var(--text-3)', fontWeight: 600 }} tickFormatter={v => `${v}cy`} />
            <YAxis stroke="var(--text-4)" tick={{ fontSize: 10, fill: 'var(--text-3)', fontWeight: 600 }} tickFormatter={v => `${v}%`} domain={[75, 105]} />
            <RechartsTooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} formatter={(v) => [`${v.toFixed(1)}%`, 'Projected SoH']} />
            <ReferenceLine y={eolThreshold} stroke="var(--red)" strokeDasharray="4 4" label={{ value: 'EOL 80%', position: 'insideRight', fontSize: 10, fill: 'var(--red)', fontWeight: 700 }} />
            <Area type="monotone" dataKey="projected" stroke="var(--yellow)" strokeWidth={2.5} fill="url(#gradHealth)" dot={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

export default function Research({ data, history }) {
  const scatterData = history.map(h => ({
    temp: Math.max(h.temp1 ?? 0, h.temp2 ?? 0),
    vib: h.vibration ?? 0,
    score: h.anomalyScore ?? 0,
  }));

  const timelineData = history.map((h, i) => ({
    idx: i,
    score: h.anomalyScore ?? 0,
    health: h.batteryHealth ?? 0,
  }));

  const health    = data?.batteryHealth ?? 100;
  const cellMax   = Math.max(data?.cell1 ?? 0, data?.cell2 ?? 0, data?.cell3 ?? 0, data?.cell4 ?? 0);
  const cellMin   = Math.min(data?.cell1 ?? 4.2, data?.cell2 ?? 4.2, data?.cell3 ?? 4.2, data?.cell4 ?? 4.2);
  const imbalance = (cellMax - cellMin).toFixed(3);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', borderLeft: '4px solid var(--yellow)' }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 20, fontWeight: 900, color: 'var(--text)', textTransform: 'uppercase', letterSpacing: 1 }}>
            Caterpillar<span style={{ color: 'var(--yellow)' }}>®</span> Data Science Lab
          </h1>
          <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--text-3)', fontWeight: 600 }}>
            Sensor correlation · Cycle life projection · Forensic anomaly analysis · Scatter spectrometry
          </p>
        </div>
        <div style={{ display: 'flex', gap: 12 }}>
          <div style={{ padding: '8px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase' }}>Dataset Size</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--blue)', fontFamily: 'var(--mono)' }}>{history.length} rows</div>
          </div>
          <div style={{ padding: '8px 14px', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8 }}>
            <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 700, textTransform: 'uppercase' }}>Cell Imbalance</div>
            <div style={{ fontSize: 18, fontWeight: 900, color: parseFloat(imbalance) > 0.1 ? 'var(--amber)' : 'var(--green)', fontFamily: 'var(--mono)' }}>{imbalance} V</div>
          </div>
        </div>
      </div>

      {/* Row 1: Correlation Matrix + Degradation Projector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 400px', gap: 20 }}>
        <Panel title="Sensor Correlation Matrix" icon={GitBranch} badge="PEARSON R">
          <CorrelationMatrix history={history} />
        </Panel>
        <Panel title="Cycle Life Degradation Projector" icon={TrendingDown} badge="EOL FORECAST">
          <DegradationProjector data={data} />
        </Panel>
      </div>

      {/* Row 2: Scatter Spectrometry + Forensic Timeline */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>

        <Panel title="Spectrometry Analysis" icon={Crosshair} badge="TEMP vs VIB">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis type="number" dataKey="temp" name="Temperature" unit="°C"
                  stroke="var(--text-4)" tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 600 }}
                  label={{ value: 'Temperature (°C)', position: 'insideBottom', offset: -10, fontSize: 11, fill: 'var(--text-4)' }}
                  domain={['dataMin - 2', 'dataMax + 2']} />
                <YAxis type="number" dataKey="vib" name="Vibration" unit="G"
                  stroke="var(--text-4)" tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 600 }}
                  label={{ value: 'Vibration (G)', angle: -90, position: 'insideLeft', fontSize: 11, fill: 'var(--text-4)' }}
                  domain={[0, 'dataMax + 0.5']} />
                <ZAxis type="number" dataKey="score" range={[30, 200]} name="Anomaly" />
                <RechartsTooltip cursor={{ strokeDasharray: '4 4', stroke: 'var(--yellow)' }}
                  contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  itemStyle={{ color: 'var(--yellow)', fontWeight: 700 }} />
                <Scatter name="Readings" data={scatterData}>
                  {scatterData.map((e, i) => (
                    <circle key={i} cx={0} cy={0} r={e.score > 20 ? 7 : 5}
                      fill={e.score > 50 ? 'var(--red)' : e.score > 20 ? 'var(--amber)' : 'var(--yellow)'}
                      opacity={0.8} />
                  ))}
                </Scatter>
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </Panel>

        <Panel title="Forensic Timeline" icon={BarChart2} badge="SCRUB TO ZOOM">
          <div style={{ height: 280 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={timelineData} margin={{ top: 10, right: 20, bottom: 20, left: 0 }}>
                <defs>
                  <linearGradient id="gradScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--yellow)" stopOpacity={0.5} />
                    <stop offset="95%" stopColor="var(--yellow)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="idx" stroke="var(--text-4)" tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 600 }} tickFormatter={v => `T${v}`} />
                <YAxis stroke="var(--text-4)" tick={{ fontSize: 11, fill: 'var(--text-3)', fontWeight: 600 }} tickFormatter={v => `${v}%`} domain={[0, 100]} />
                <RechartsTooltip contentStyle={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }} itemStyle={{ color: 'var(--yellow)', fontWeight: 700 }} />
                <ReferenceLine y={50} stroke="var(--red)" strokeDasharray="4 4" label={{ value: 'CRIT', position: 'insideRight', fontSize: 10, fill: 'var(--red)', fontWeight: 700 }} />
                <ReferenceLine y={15} stroke="var(--amber)" strokeDasharray="4 4" label={{ value: 'WARN', position: 'insideRight', fontSize: 10, fill: 'var(--amber)', fontWeight: 700 }} />
                <Area type="monotone" dataKey="score" stroke="var(--yellow)" strokeWidth={2.5} fill="url(#gradScore)" dot={false} />
                <Brush dataKey="idx" height={24} stroke="var(--border)" fill="var(--surface-2)" travellerWidth={8} tickFormatter={() => ''} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Row 3: Research Insights — Dynamic */}
      <Panel title="Research Insights" icon={FlaskConical}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            {
              title: 'Thermal Stability', status: Math.max(data?.temp1 ?? 0, data?.temp2 ?? 0) > 55 ? 'ATTENTION' : 'NOMINAL',
              color: Math.max(data?.temp1 ?? 0, data?.temp2 ?? 0) > 55 ? 'var(--amber)' : 'var(--green)',
              text: `Peak thermal reading: ${Math.max(data?.temp1 ?? 0, data?.temp2 ?? 0).toFixed(1)}°C. ${Math.max(data?.temp1 ?? 0, data?.temp2 ?? 0) > 55 ? 'Thermal runaway risk window approaching — review cooling.' : 'Pack temperature remains within optimal boundaries. No hotspots detected.'}`
            },
            {
              title: 'Cell Balancing', status: parseFloat(imbalance) > 0.1 ? 'ATTENTION' : 'NOMINAL',
              color: parseFloat(imbalance) > 0.1 ? 'var(--amber)' : 'var(--green)',
              text: `Cell voltage spread: ${imbalance}V. ${parseFloat(imbalance) > 0.1 ? 'Voltage delta exceeds 100mV. Recommend scheduling an active balancing cycle.' : 'Cells are balanced within tolerance. Pack operating efficiently.'}`
            },
            {
              title: 'Gas Evolution', status: (data?.gas ?? 0) > 150 ? 'WARNING' : 'NOMINAL',
              color: (data?.gas ?? 0) > 150 ? 'var(--amber)' : 'var(--green)',
              text: `VOC reading: ${Math.round(data?.gas ?? 0)} ppm. ${(data?.gas ?? 0) > 150 ? 'Elevated outgassing detected. This may indicate electrolyte decomposition.' : 'No outgassing events predicted at current emission levels.'}`
            },
          ].map(({ title, status, color, text }) => (
            <div key={title} style={{ padding: 16, background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 6, borderLeft: `3px solid ${color}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)', textTransform: 'uppercase' }}>{title}</span>
                <span style={{ fontSize: 10, fontWeight: 700, color, letterSpacing: 1 }}>{status}</span>
              </div>
              <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)', lineHeight: 1.6 }}>{text}</p>
            </div>
          ))}
        </div>
      </Panel>

    </div>
  );
}
