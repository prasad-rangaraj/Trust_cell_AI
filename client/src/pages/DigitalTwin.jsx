import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, ResponsiveContainer, XAxis, YAxis, Tooltip } from 'recharts';
import { Thermometer, Zap, Wind, Power, Activity, Sliders, ShieldAlert, CheckCircle, RotateCcw } from 'lucide-react';

export default function DigitalTwin({ data, history = [] }) {
  const [selectedCell, setSelectedCell] = useState(1);
  const [activeTab, setActiveTab] = useState('heatmap'); // 'heatmap' | 'voltage'
  const [modelType, setModelType] = useState('sketchfab'); // 'sketchfab' | 'isometric'
  const [currentScenario, setCurrentScenario] = useState('normal');
  const [relayLoading, setRelayLoading] = useState(false);
  const [localRelay, setLocalRelay] = useState(data?.relay || 'CONNECTED');

  // Detect current theme (dark or light) for Sketchfab embed
  const themeMode = typeof document !== 'undefined' ? document.documentElement.getAttribute('data-theme') || 'dark' : 'dark';

  // Sync local relay state with live data
  useEffect(() => {
    if (data?.relay) {
      setLocalRelay(data.relay);
    }
  }, [data?.relay]);

  // Read current scenario on mount
  useEffect(() => {
    fetch('/api/system/health')
      .then((r) => r.json())
      .then((d) => d.success && setCurrentScenario(d.data.scenario))
      .catch(() => {});
  }, []);

  const triggerScenario = async (sc) => {
    setCurrentScenario(sc);
    try {
      await fetch('/api/demo/scenario', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenario: sc }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const toggleRelay = async (action) => {
    setRelayLoading(true);
    try {
      // Simulate API call for relay trigger
      await new Promise((r) => setTimeout(r, 600));
      setLocalRelay(action === 'CONNECT' ? 'CONNECTED' : 'DISCONNECTED');
    } catch (e) {
      console.error(e);
    } finally {
      setRelayLoading(false);
    }
  };

  // Extract cell values
  const c1 = data?.cell1 ?? 4.01;
  const c2 = data?.cell2 ?? 4.02;
  const c3 = data?.cell3 ?? 3.98;
  const c4 = data?.cell4 ?? 4.00;
  const temp = data?.temperature ?? 34;
  const gas = data?.gas ?? 120;
  const current = data?.current ?? 2.1;
  const health = data?.batteryHealth ?? 96.2;
  const score = data?.anomalyScore ?? 4.0;
  const status = data?.status ?? 'Healthy';

  const cells = [
    { id: 1, name: 'Cell 1', voltage: c1, temp: temp - 0.5 },
    { id: 2, name: 'Cell 2', voltage: c2, temp: temp + 0.2 },
    { id: 3, name: 'Cell 3', voltage: c3, temp: temp - 0.8 },
    { id: 4, name: 'Cell 4', voltage: c4, temp: temp + 0.4 },
  ];

  // Helper colors
  const getCellColor = (cell) => {
    if (activeTab === 'voltage') {
      const v = cell.voltage;
      if (v < 3.6) return 'var(--red)';
      if (v < 3.8) return 'var(--amber)';
      return 'var(--blue)';
    } else {
      // Heatmap view
      const t = cell.temp;
      if (t > 60) return 'var(--red)';
      if (t > 45) return 'var(--amber)';
      return 'var(--green)';
    }
  };

  // Sparkline history for chart
  const cellHistoryData = history.map((h, index) => ({
    time: index,
    voltage: h[`cell${selectedCell}`] ?? 4.0,
    temp: (h.temperature ?? 34) + (selectedCell === 2 ? 0.2 : selectedCell === 4 ? 0.4 : selectedCell === 3 ? -0.8 : -0.5),
  }));

  // Determine fan animation class
  const getFanClass = () => {
    if (localRelay === 'DISCONNECTED' || status === 'Critical') return '';
    if (temp > 55) return 'animate-spin-fast';
    if (temp > 40) return 'animate-spin-medium';
    return 'animate-spin-slow';
  };

  const activeColor = status === 'Healthy' ? 'var(--green)' : status === 'Warning' ? 'var(--amber)' : 'var(--red)';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">BMS Digital Twin</h1>
          <p className="page-sub">Interactive 3D CAD twin & telemetry telemetry mapping</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="card" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600 }}>SYNC STATUS:</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'dot-pulse 1.5s infinite' }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>LIVE SYNCED</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1.2fr', gap: 16 }}>
        
        {/* Left Column: 3D Isometric View */}
        <div className="card" style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', gap: 8, background: 'var(--surface-3)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
              <button 
                onClick={() => setModelType('sketchfab')} 
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: modelType === 'sketchfab' ? 'var(--surface)' : 'transparent',
                  color: modelType === 'sketchfab' ? 'var(--text)' : 'var(--text-3)',
                  transition: 'all 0.15s ease'
                }}
              >
                3D CAD Twin (Sketchfab)
              </button>
              <button 
                onClick={() => setModelType('isometric')} 
                style={{
                  padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                  background: modelType === 'isometric' ? 'var(--surface)' : 'transparent',
                  color: modelType === 'isometric' ? 'var(--text)' : 'var(--text-3)',
                  transition: 'all 0.15s ease'
                }}
              >
                Telemetry Twin
              </button>
            </div>

            {modelType === 'isometric' && (
              <div style={{ display: 'flex', background: 'var(--surface-3)', padding: 3, borderRadius: 8, border: '1px solid var(--border)' }}>
                <button 
                  onClick={() => setActiveTab('heatmap')} 
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: activeTab === 'heatmap' ? 'var(--surface)' : 'transparent',
                    color: activeTab === 'heatmap' ? 'var(--text)' : 'var(--text-3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Temp Heatmap
                </button>
                <button 
                  onClick={() => setActiveTab('voltage')} 
                  style={{
                    padding: '4px 10px', borderRadius: 6, fontSize: 11, fontWeight: 600, border: 'none', cursor: 'pointer',
                    background: activeTab === 'voltage' ? 'var(--surface)' : 'transparent',
                    color: activeTab === 'voltage' ? 'var(--text)' : 'var(--text-3)',
                    transition: 'all 0.15s ease'
                  }}
                >
                  Voltage State
                </button>
              </div>
            )}
          </div>

          <div className="card-body" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 380, position: 'relative', overflow: 'hidden' }}>
            {modelType === 'sketchfab' ? (
              <div style={{ width: '100%', height: '100%', minHeight: 380, display: 'flex', flexDirection: 'column', position: 'relative' }}>
                <iframe 
                  title="3.7V Li-ion Battery" 
                  style={{ width: '100%', height: '330px', border: 0, borderRadius: 12, background: 'rgba(0,0,0,0.1)' }}
                  src={`https://sketchfab.com/models/f6d70c75efbb44d08763fc18c6bfad8c/embed?autostart=1&preload=1&ui_controls=1&ui_infos=0&ui_inspector=0&ui_watermark=0&theme=${themeMode}`} 
                  allow="autoplay; fullscreen; xr-spatial-tracking"
                  execution-while-out-of-viewport="true"
                  execution-while-not-rendered="true"
                ></iframe>
                
                {/* Float Info Box under Sketchfab */}
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, marginTop: 12 }}>
                  <div className="card" style={{ padding: '6px 12px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8, flex: 1, border: '1px solid var(--border)' }}>
                    <Thermometer size={14} color="var(--amber)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600 }}>PACK TEMP</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: temp > 55 ? 'var(--red)' : temp > 45 ? 'var(--amber)' : 'var(--text)' }}>
                        {temp.toFixed(1)}°C
                      </span>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '6px 12px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8, flex: 1, border: '1px solid var(--border)' }}>
                    <Zap size={14} color="var(--blue)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600 }}>CURRENT DRAW</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{current.toFixed(2)}A</span>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '6px 12px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8, flex: 1, border: '1px solid var(--border)' }}>
                    <Wind size={14} color="var(--green)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600 }}>VOC GAS</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: gas > 250 ? 'var(--red)' : 'var(--green)' }}>{Math.round(gas)} ppm</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* SVG 3D Isometric Pack */}
                <svg viewBox="0 0 600 380" style={{ width: '100%', height: '100%', maxWidth: 550 }}>
                  {/* Ground shadow / base plate */}
                  <ellipse cx="300" cy="290" rx="220" ry="60" fill="var(--border)" opacity="0.4" />

                  {/* ── Outer Protective Battery Housing (Translucent Glass) ── */}
                  {/* Back Walls */}
                  <polygon points="100,240 300,140 500,240 300,340" fill="var(--surface-3)" stroke="var(--border)" strokeWidth="1" opacity="0.3" />
                  
                  {/* Current lines animation (if relay connected) */}
                  {localRelay === 'CONNECTED' && (
                    <>
                      <path d="M 160,250 L 300,180 L 440,250" fill="none" stroke="var(--yellow)" strokeWidth="2.5" opacity="0.85" className="current-line-flow" />
                      <path d="M 440,250 L 480,270 L 510,255" fill="none" stroke="var(--yellow)" strokeWidth="2.5" opacity="0.85" className="current-line-flow" />
                    </>
                  )}

                  {/* ── Cell Pack Assembly ── */}
                  {cells.map((cell, idx) => {
                    // Determine isometric position shifts for the 4 cells aligned side by side
                    // Aligned along diagonal
                    const dx = (idx - 1.5) * 64;
                    const dy = (idx - 1.5) * 32;
                    const cx = 300 + dx;
                    const cy = 230 - dy;

                    const isSelected = selectedCell === cell.id;
                    const fillCol = getCellColor(cell);
                    const strokeCol = isSelected ? 'var(--yellow)' : 'var(--border-2)';
                    const strokeW = isSelected ? 2.5 : 1;

                    return (
                      <g 
                        key={cell.id} 
                        cursor="pointer" 
                        onClick={() => setSelectedCell(cell.id)}
                        style={{ transform: 'translate(0px, 0px)', transition: 'transform 0.3s ease' }}
                      >
                        {/* Isometric Cell Cylinder Cylinder Side (Left side of cell) */}
                        <path 
                          d={`M ${cx - 24},${cy + 15} L ${cx - 24},${cy + 75} A 24,14 0 0,0 ${cx + 24},${cy + 75} L ${cx + 24},${cy + 15} Z`} 
                          fill={fillCol} 
                          opacity="0.8" 
                          stroke={strokeCol}
                          strokeWidth={strokeW}
                        />
                        
                        {/* Darker shade inside/right side for depth */}
                        <path 
                          d={`M ${cx},${cy + 22} L ${cx},${cy + 82} A 24,14 0 0,0 ${cx + 24},${cy + 75} L ${cx + 24},${cy + 15} Z`} 
                          fill="#000" 
                          opacity="0.12" 
                        />

                        {/* Cylinder Top Cap */}
                        <ellipse 
                          cx={cx} 
                          cy={cy + 15} 
                          rx="24" 
                          ry="12" 
                          fill={fillCol} 
                          filter="brightness(1.15)"
                          stroke={strokeCol}
                          strokeWidth={strokeW}
                        />

                        {/* Selected Indicator Ring (floating above cell) */}
                        {isSelected && (
                          <ellipse 
                            cx={cx} 
                            cy={cy - 5} 
                            rx="20" 
                            ry="10" 
                            fill="none" 
                            stroke="var(--yellow)" 
                            strokeWidth="2" 
                            strokeDasharray="4 2"
                            className="relay-blade-active"
                          />
                        )}

                        {/* Cell terminal cap */}
                        <ellipse cx={cx} cy={cy + 11} rx="8" ry="4" fill="var(--border-2)" />
                        <rect x={cx - 3} y={cy + 4} width="6" height="6" fill="var(--border-2)" />

                        {/* Cell Label Tag */}
                        <text 
                          x={cx} 
                          y={cy + 52} 
                          textAnchor="middle" 
                          fill="#fff" 
                          fontSize="9" 
                          fontWeight="bold" 
                          fontFamily="var(--mono)"
                          style={{ pointerEvents: 'none', textShadow: '0 1px 3px rgba(0,0,0,0.6)' }}
                        >
                          C{cell.id}
                        </text>

                        {/* Mini float values */}
                        <text 
                          x={cx} 
                          y={cy - 12} 
                          textAnchor="middle" 
                          fill="var(--text)" 
                          fontSize="10" 
                          fontWeight="700" 
                          fontFamily="var(--mono)"
                          style={{ pointerEvents: 'none', transition: 'fill 0.2s' }}
                        >
                          {activeTab === 'voltage' ? `${cell.voltage.toFixed(2)}V` : `${cell.temp.toFixed(0)}°C`}
                        </text>
                      </g>
                    );
                  })}

                  {/* ── Cooling Fan (SVG Rotating Fan on Left Side) ── */}
                  <g transform="translate(140, 160)">
                    <ellipse cx="0" cy="0" rx="30" ry="15" fill="var(--surface-3)" stroke="var(--border)" strokeWidth="1.5" />
                    <g className={getFanClass()} style={{ transformOrigin: '0px 0px' }}>
                      {/* Fan blades */}
                      <path d="M 0,0 C -12,-15 -25,-5 -20,10 C -15,12 -5,5 0,0 Z" fill="var(--text-3)" />
                      <path d="M 0,0 C 12,15 25,5 20,-10 C 15,-12 5,-5 0,0 Z" fill="var(--text-3)" />
                      <path d="M 0,0 C -15,12 -5,25 10,20 C 12,15 5,5 0,0 Z" fill="var(--text-3)" />
                      <path d="M 0,0 C 15,-12 5,-25 -10,-20 C -12,-15 -5,-5 0,0 Z" fill="var(--text-3)" />
                      <circle cx="0" cy="0" r="6" fill="var(--border-2)" />
                    </g>
                    <text x="0" y="28" textAnchor="middle" fill="var(--text-3)" fontSize="8.5" fontWeight="700" letterSpacing="0.05em">COOLING FAN</text>
                  </g>

                  {/* ── Contactor / Safety Relay Switch (Right Side) ── */}
                  <g transform="translate(460, 270)">
                    <rect x="-35" y="-20" width="70" height="40" rx="6" fill="var(--surface-2)" stroke="var(--border)" strokeWidth="1.5" />
                    {/* Contactor Contact Terminals */}
                    <circle cx="-20" cy="0" r="4" fill="var(--text-3)" />
                    <circle cx="20" cy="0" r="4" fill="var(--text-3)" />
                    {/* Relay Switch Blade */}
                    {localRelay === 'CONNECTED' ? (
                      // Connected State (Horizontal Blade bridging terminals)
                      <line x1="-20" y1="0" x2="20" y2="0" stroke="var(--green)" strokeWidth="3" strokeLinecap="round" />
                    ) : (
                      // Disconnected State (Open Angle Blade)
                      <line x1="-20" y1="0" x2="10" y2="-18" stroke="var(--red)" strokeWidth="3" strokeLinecap="round" className="relay-blade-active" />
                    )}
                    <text x="0" y="32" textAnchor="middle" fill="var(--text-3)" fontSize="8.5" fontWeight="700" letterSpacing="0.05em">BMS RELAY</text>
                  </g>

                  {/* ── Gas Outgassing Particle Overlay (Animated Smoke) ── */}
                  {gas > 200 && (
                    <g transform="translate(300, 180)">
                      {/* Smoke particle 1 */}
                      <circle cx="-40" cy="-20" r="14" fill="var(--text-4)" opacity="0.25" className="smoke-particle" style={{ animationDelay: '0s' }} />
                      {/* Smoke particle 2 */}
                      <circle cx="20" cy="-35" r="18" fill="var(--text-4)" opacity="0.2" className="smoke-particle" style={{ animationDelay: '0.6s' }} />
                      {/* Smoke particle 3 */}
                      <circle cx="-10" cy="-10" r="16" fill="var(--text-4)" opacity="0.3" className="smoke-particle" style={{ animationDelay: '1.2s' }} />
                      {/* Gas warning label */}
                      <g transform="translate(0, -60)">
                        <rect x="-65" y="-12" width="130" height="24" rx="4" fill="var(--red-bg)" stroke="var(--red-border)" strokeWidth="1" />
                        <text x="0" y="4" textAnchor="middle" fill="var(--red)" fontSize="10" fontWeight="bold">⚠ CRITICAL OUTGASSING</text>
                      </g>
                    </g>
                  )}
                </svg>

                {/* Float Info Box */}
                <div style={{ position: 'absolute', bottom: 12, left: 16, right: 16, display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                  <div className="card" style={{ padding: '6px 12px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8, flex: 1, border: '1px solid var(--border)' }}>
                    <Thermometer size={14} color="var(--amber)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600 }}>PACK TEMP</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: temp > 55 ? 'var(--red)' : temp > 45 ? 'var(--amber)' : 'var(--text)' }}>
                        {temp.toFixed(1)}°C
                      </span>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '6px 12px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8, flex: 1, border: '1px solid var(--border)' }}>
                    <Zap size={14} color="var(--blue)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600 }}>CURRENT DRAW</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: 'var(--blue)' }}>{current.toFixed(2)}A</span>
                    </div>
                  </div>
                  <div className="card" style={{ padding: '6px 12px', background: 'var(--surface)', display: 'flex', alignItems: 'center', gap: 8, flex: 1, border: '1px solid var(--border)' }}>
                    <Wind size={14} color="var(--green)" />
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 9, color: 'var(--text-4)', fontWeight: 600 }}>VOC GAS</span>
                      <span style={{ fontSize: 12, fontWeight: 700, fontFamily: 'var(--mono)', color: gas > 250 ? 'var(--red)' : 'var(--green)' }}>{Math.round(gas)} ppm</span>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Inspector & Simulators */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          
          {/* Cell Inspector Card */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Cell {selectedCell} Inspector</div>
              <span className="badge badge-purple" style={{ fontFamily: 'var(--mono)' }}>NODE_0{selectedCell}</span>
            </div>
            
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {/* Voltage Stat */}
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Zap size={11} color="var(--blue)" /> VOLTAGE
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--blue)', marginTop: 4 }}>
                    {cells[selectedCell - 1].voltage.toFixed(3)}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginLeft: 2 }}>V</span>
                  </div>
                </div>

                {/* Temp Stat */}
                <div style={{ padding: 12, background: 'var(--surface-2)', borderRadius: 10, border: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 10, color: 'var(--text-4)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Thermometer size={11} color="var(--amber)" /> TEMPERATURE
                  </div>
                  <div style={{ fontSize: 22, fontWeight: 800, fontFamily: 'var(--mono)', color: 'var(--amber)', marginTop: 4 }}>
                    {cells[selectedCell - 1].temp.toFixed(1)}<span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginLeft: 2 }}>°C</span>
                  </div>
                </div>
              </div>

              {/* Sparkline line chart for selected cell */}
              <div style={{ height: 110, marginTop: 4 }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6 }}>Live Cell History</div>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cellHistoryData}>
                    <defs>
                      <linearGradient id="cellChart" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--blue)" stopOpacity={0.2} />
                        <stop offset="95%" stopColor="var(--blue)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', fontSize: 11 }} labelFormatter={() => ''} />
                    <Area type="monotone" dataKey="voltage" name="Voltage" stroke="var(--blue)" strokeWidth={1.5} fill="url(#cellChart)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderTop: '1px solid var(--border)', fontSize: 11.5 }}>
                <span style={{ color: 'var(--text-3)' }}>Degradation Rating</span>
                <span style={{ fontWeight: 700, color: 'var(--green)' }}>Excellent (0.01% drift)</span>
              </div>
            </div>
          </div>

          {/* Controller & Overrides */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={14} color="var(--yellow)" />
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Digital Twin Sim Control</div>
              </div>
            </div>

            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, color: 'var(--text-3)', lineHeight: 1.4 }}>
                Inject faults on the digital twin to test isolated responses and automatic safety action triggers instantly:
              </div>

              {/* Sim scenario list */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { id: 'normal', label: 'Normal System', color: 'var(--green-border)', activeColor: 'var(--green-bg)' },
                  { id: 'imbalance', label: 'Cell Imbalance', color: 'var(--amber-border)', activeColor: 'var(--amber-bg)' },
                  { id: 'overtemp', label: 'Thermal Warning', color: 'var(--amber-border)', activeColor: 'var(--amber-bg)' },
                  { id: 'gas', label: 'Thermal Runway', color: 'var(--red-border)', activeColor: 'var(--red-bg)' },
                ].map((sc) => {
                  const isCurrent = currentScenario === sc.id;
                  return (
                    <button
                      key={sc.id}
                      onClick={() => triggerScenario(sc.id)}
                      className="btn"
                      style={{
                        padding: '8px 10px',
                        fontSize: 11.5,
                        borderRadius: 8,
                        background: isCurrent ? sc.activeColor : 'var(--surface-2)',
                        border: `1px solid ${isCurrent ? 'var(--yellow)' : 'var(--border)'}`,
                        color: 'var(--text-2)',
                        fontWeight: isCurrent ? 700 : 500,
                        cursor: 'pointer',
                        transition: 'all 0.15s'
                      }}
                    >
                      {sc.label}
                    </button>
                  );
                })}
              </div>

              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

              {/* Relay status controls */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)' }}>Contactor Control Override</span>
                  <span className={`badge ${localRelay === 'CONNECTED' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 9 }}>
                    {localRelay}
                  </span>
                </div>
                
                <div style={{ display: 'flex', gap: 8 }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ flex: 1, padding: '6px' }}
                    disabled={relayLoading || localRelay === 'CONNECTED'} 
                    onClick={() => toggleRelay('CONNECT')}
                  >
                    <Power size={11} color="var(--green)" /> Close Contactor
                  </button>
                  <button 
                    className="btn btn-danger btn-sm" 
                    style={{ flex: 1, padding: '6px' }}
                    disabled={relayLoading || localRelay === 'DISCONNECTED'} 
                    onClick={() => toggleRelay('DISCONNECT')}
                  >
                    <Power size={11} /> Open Contactor
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
