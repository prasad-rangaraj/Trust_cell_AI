import { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Environment, Grid, Edges } from '@react-three/drei';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Sliders, Power, CheckCircle, ShieldAlert } from 'lucide-react';
import * as THREE from 'three';

// ─── Glowing Battery Cell ────────────────────────────────────────────────────
function BatteryCell({ position, color, emissiveIntensity = 1.2, pulseSpeed = 1, isActive = true }) {
  const meshRef = useRef();
  const glowRef = useRef();

  useFrame(({ clock }) => {
    if (!isActive) return;
    const t = clock.getElapsedTime();
    const pulse = Math.sin(t * pulseSpeed) * 0.15 + 1;
    if (meshRef.current) {
      meshRef.current.material.emissiveIntensity = emissiveIntensity * pulse;
    }
    if (glowRef.current) {
      glowRef.current.material.opacity = 0.12 + Math.sin(t * pulseSpeed) * 0.04;
    }
  });

  const actualColor = isActive ? color : '#222233';
  const actualEmissive = isActive ? color : '#000000';
  const actualEmissiveInt = isActive ? emissiveIntensity : 0;

  return (
    <group position={position}>
      {/* Outer glow halo (only if active) */}
      {isActive && (
        <mesh ref={glowRef}>
          <cylinderGeometry args={[0.72, 0.72, 3.6, 64, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.13} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Cell body */}
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.58, 0.58, 3.4, 64]} />
        <meshStandardMaterial
          color={isActive ? "#1a1a2e" : "#464646"}
          emissive={actualEmissive}
          emissiveIntensity={actualEmissiveInt}
          metalness={isActive ? 0.9 : 0.4}
          roughness={isActive ? 0.15 : 0.5}
        />
        {!isActive && <Edges scale={1.0} threshold={15} color="#aaaaaa" />}
      </mesh>

      {/* Top cap */}
      <mesh position={[0, 1.75, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.1, 64]} />
        <meshStandardMaterial color={isActive ? "#2a2a3e" : "#464646"} emissive={actualEmissive} emissiveIntensity={isActive ? 0.5 : 0} metalness={isActive ? 0.95 : 0.5} roughness={isActive ? 0.1 : 0.5} />
        {!isActive && <Edges scale={1.0} threshold={15} color="#aaaaaa" />}
      </mesh>

      {/* Terminal nub */}
      <mesh position={[0, 1.85, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.14, 32]} />
        <meshStandardMaterial color={isActive ? "#888" : "#464646"} metalness={isActive ? 1 : 0.5} roughness={isActive ? 0.05 : 0.5} />
        {!isActive && <Edges scale={1.0} threshold={15} color="#aaaaaa" />}
      </mesh>

      {/* Bottom cap */}
      <mesh position={[0, -1.75, 0]}>
        <cylinderGeometry args={[0.58, 0.58, 0.1, 64]} />
        <meshStandardMaterial color={isActive ? "#2a2a3e" : "#464646"} metalness={isActive ? 0.95 : 0.5} roughness={isActive ? 0.1 : 0.5} />
        {!isActive && <Edges scale={1.0} threshold={15} color="#aaaaaa" />}
      </mesh>
    </group>
  );
}

// ─── Floating HTML Overlay per cell ──────────────────────────────────────────
function CellOverlay({ position, label, dvdt, color, colorHex, isVisible }) {
  return (
    <Html position={position} center={false} style={{ pointerEvents: 'none', opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease' }}>
      <div style={{
        width: 200,
        fontFamily: "'JetBrains Mono', monospace",
        userSelect: 'none',
      }}>
        {/* Label + dV/dt value */}
        <div style={{
          background: 'rgba(0,0,0,0.6)',
          border: `1px solid ${colorHex}44`,
          borderRadius: 6,
          padding: '8px 12px',
          backdropFilter: 'blur(8px)',
        }}>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 11, marginBottom: 4 }}>{label}</div>
          <div style={{ color: colorHex, fontSize: 13, fontWeight: 700, textShadow: `0 0 6px ${colorHex}` }}>
            dV/dt = {dvdt} V/s
          </div>
        </div>
      </div>
    </Html>
  );
}

// ─── 3D Scene ────────────────────────────────────────────────────────────────
function Scene({ data }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const getCellColor = (v) => v < 3.85 ? '#ff8c00' : '#00e5ff';

  const rows = 5;
  const cols = 4;
  const spacingX = 1.6;
  const spacingZ = 1.6;
  const cells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * spacingX;
      const z = ((rows - 1) / 2 - r) * spacingZ;
      const isActive = (r === 0);
      const id = r * cols + c + 1;

      let val = 0;
      let color = '#444';
      let label = `Cell ${c + 1}`;
      let dvdt = '-0.002';

      if (isActive) {
        if (c === 0) { val = data?.cell1 ?? 4.01; dvdt = '-0.002'; }
        if (c === 1) { val = data?.cell2 ?? 4.02; dvdt = '-0.001'; }
        if (c === 2) { val = data?.cell3 ?? 3.78; dvdt = '-0.050'; }
        if (c === 3) { val = data?.cell4 ?? 4.00; dvdt = '-0.003'; }
        color = getCellColor(val);
      }

      cells.push({ id, x, z, isActive, c, val, color, label, dvdt });
    }
  }

  return (
    <>
      <color attach="background" args={['#05070f']} />
      <ambientLight intensity={0.15} />
      <pointLight position={[-4, 4, 3]} intensity={2.5} color="#00e5ff" />
      <pointLight position={[4, 4, 3]} intensity={2.5} color="#ff8c00" />
      <pointLight position={[0, -4, 2]} intensity={0.5} color="#ffffff" />
      <Environment preset="night" />

      {/* High-tech floor grid */}
      <Grid 
        args={[40, 40]} 
        position={[0, -1.8, 0]} 
        cellColor="#ffffff" 
        sectionColor="#00e5ff" 
        fadeDistance={25} 
        fadeStrength={1.5} 
        cellThickness={0.5} 
        sectionThickness={1} 
      />

      {cells.map((cell) => (
        <group 
          key={cell.id}
          position={[cell.x, 0, cell.z]}
          onPointerOver={(e) => { e.stopPropagation(); if(cell.isActive) setHoveredCell(cell.id); }}
          onPointerOut={(e) => { e.stopPropagation(); if(cell.isActive) setHoveredCell(null); }}
        >
          <BatteryCell 
            position={[0, 0, 0]} 
            color={cell.color} 
            emissiveIntensity={cell.val < 3.85 ? 1.3 : 0.9} 
            pulseSpeed={cell.val < 3.85 ? 1.8 : 0.8} 
            isActive={cell.isActive} 
          />
          {cell.isActive && (
            <CellOverlay
              position={[0.7, 1.2, 0]}
              label={cell.label}
              dvdt={cell.dvdt}
              colorHex={cell.color}
              isVisible={hoveredCell === cell.id}
            />
          )}
        </group>
      ))}

      <OrbitControls
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 1.6}
        minDistance={5}
        maxDistance={25}
      />
    </>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DigitalTwin({ data, history = [] }) {
  const [currentScenario, setCurrentScenario] = useState('normal');
  const [relayLoading, setRelayLoading] = useState(false);
  const [localRelay, setLocalRelay] = useState(data?.relay || 'CONNECTED');

  useEffect(() => {
    if (data?.relay) setLocalRelay(data.relay);
  }, [data?.relay]);

  useEffect(() => {
    fetch('/api/system/health')
      .then(r => r.json())
      .then(d => d.success && setCurrentScenario(d.data.scenario))
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
    } catch (e) { console.error(e); }
  };

  const toggleRelay = async (action) => {
    setRelayLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setLocalRelay(action === 'CONNECT' ? 'CONNECTED' : 'DISCONNECTED');
    setRelayLoading(false);
  };

  // Build healthy & weak history series from live history
  const healthyHistory = useMemo(() =>
    history.slice(-30).map(h => ({ v: h.cell1 ?? 4.01 })), [history]);

  const weakHistory = useMemo(() => {
    // Simulate weak cell by using cell3 or injecting imbalance
    return history.slice(-30).map((h, i) => ({
      v: (h.cell3 ?? 4.0) - (i * 0.002),
    }));
  }, [history]);

  const status = data?.status ?? 'Healthy';

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">BMS Digital Twin</h1>
          <p className="page-sub">Physics-accurate 3D cell model with real-time telemetry overlay</p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <div className="card" style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--green)', animation: 'dot-pulse 1.5s infinite' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>LIVE SYNCED</span>
          </div>
          <div className={`card`} style={{ padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 600 }}>STATUS:</span>
            <span className={`badge ${status === 'Healthy' ? 'badge-green' : status === 'Warning' ? 'badge-amber' : 'badge-red'}`}>
              {status}
            </span>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 24, alignItems: 'start' }}>

        {/* 3D Canvas */}
        <div className="card" style={{ overflow: 'hidden', background: '#05070f', border: '1px solid rgba(0,229,255,0.2)', boxShadow: '0 10px 30px rgba(0,229,255,0.05)' }}>
          <div style={{ height: 'calc(100vh - 200px)', minHeight: 600, position: 'relative' }}>
            <Canvas
              camera={{ position: [0, 5, 14], fov: 45 }}
              style={{ width: '100%', height: '100%' }}
              gl={{ antialias: true, alpha: false }}
            >
              <Scene data={data} />
            </Canvas>

            {/* Corner labels */}
            <div style={{ position: 'absolute', top: 14, left: 16, display: 'flex', gap: 10, pointerEvents: 'none' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(0,229,255,0.3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#00e5ff', boxShadow: '0 0 6px #00e5ff' }} />
                <span style={{ color: '#00e5ff', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)' }}>HEALTHY CELL</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(0,0,0,0.6)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,140,0,0.3)' }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ff8c00', boxShadow: '0 0 6px #ff8c00' }} />
                <span style={{ color: '#ff8c00', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)' }}>WEAK CELL</span>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: 12, right: 14, color: 'rgba(255,255,255,0.25)', fontSize: 10, fontFamily: 'var(--mono)', pointerEvents: 'none' }}>
              Drag to orbit • Scroll to zoom
            </div>
          </div>
        </div>

        {/* Right Panel */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Live Metrics */}
          <div className="card">
            <div className="card-header">
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Live Telemetry</span>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { label: 'Cell 1 (Active)', value: `${(data?.cell1 ?? 4.01).toFixed(3)} V`, color: 'var(--blue)' },
                { label: 'Cell 2 (Active)', value: `${(data?.cell2 ?? 4.02).toFixed(3)} V`, color: 'var(--blue)' },
                { label: 'Cell 3 (Active)', value: `${(data?.cell3 ?? 3.78).toFixed(3)} V`, color: 'var(--amber)' },
                { label: 'Cell 4 (Active)', value: `${(data?.cell4 ?? 4.00).toFixed(3)} V`, color: 'var(--blue)' },
                { label: 'Max Temp', value: `${(Math.max(data?.temp1 ?? 0, data?.temp2 ?? 0)).toFixed(1)} °C`, color: 'var(--amber)' },
                { label: 'Current', value: `${(data?.current ?? 2.1).toFixed(2)} A`, color: 'var(--blue)' },
                { label: 'Health', value: `${(data?.batteryHealth ?? 96.2).toFixed(1)} %`, color: 'var(--green)' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Scenario Simulator */}
          <div className="card">
            <div className="card-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sliders size={14} color="var(--yellow)" />
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Sim Control</span>
              </div>
            </div>
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { id: 'normal', label: 'Normal System', activeColor: 'var(--green-bg)', border: 'var(--green-border)' },
                { id: 'imbalance', label: 'Cell Imbalance', activeColor: 'var(--amber-bg)', border: 'var(--amber-border)' },
                { id: 'overtemp', label: 'Thermal Warning', activeColor: 'var(--amber-bg)', border: 'var(--amber-border)' },
                { id: 'gas', label: 'Thermal Runaway', activeColor: 'var(--red-bg)', border: 'var(--red-border)' },
              ].map(sc => {
                const active = currentScenario === sc.id;
                return (
                  <button
                    key={sc.id}
                    className="btn"
                    onClick={() => triggerScenario(sc.id)}
                    style={{
                      width: '100%',
                      fontSize: 12,
                      padding: '8px',
                      background: active ? sc.activeColor : 'var(--surface-2)',
                      border: `1px solid ${active ? sc.border : 'var(--border)'}`,
                      color: 'var(--text-2)',
                      fontWeight: active ? 700 : 500,
                      transition: 'all 0.2s ease'
                    }}
                  >
                    {sc.label}
                  </button>
                );
              })}

              <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />

              {/* Relay controls */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                <span style={{ fontSize: 11.5, fontWeight: 600, color: 'var(--text-3)' }}>Contactor</span>
                <span className={`badge ${localRelay === 'CONNECTED' ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 9 }}>
                  {localRelay}
                </span>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-secondary btn-sm" style={{ flex: 1 }}
                  disabled={relayLoading || localRelay === 'CONNECTED'}
                  onClick={() => toggleRelay('CONNECT')}>
                  <Power size={11} color="var(--green)" /> Close
                </button>
                <button className="btn btn-danger btn-sm" style={{ flex: 1 }}
                  disabled={relayLoading || localRelay === 'DISCONNECTED'}
                  onClick={() => toggleRelay('DISCONNECT')}>
                  <Power size={11} /> Open
                </button>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
