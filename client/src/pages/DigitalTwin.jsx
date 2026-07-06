import { useRef, useMemo, useState, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Html, OrbitControls, Environment, Grid, Edges, useGLTF } from '@react-three/drei';
import { AreaChart, Area, ResponsiveContainer } from 'recharts';
import { Sliders, Power, CheckCircle, ShieldAlert } from 'lucide-react';
import * as THREE from 'three';

// ─── Glowing Battery Cell ────────────────────────────────────────────────────
function BatteryCell({ position, color, emissiveIntensity = 1.2, pulseSpeed = 1, isActive = true, fillPct = 100 }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const fillRef = useRef();

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
    if (fillRef.current) {
      // Gentle floating/bobbing effect for the liquid
      const baseFillY = -1.69 + ((3.38 * (Math.max(Math.min(fillPct, 95), 1) / 100)) / 2);
      fillRef.current.position.y = baseFillY + Math.sin(t * pulseSpeed * 1.5) * 0.03;
    }
  });

  const actualColor = isActive ? color : '#222233';
  const actualEmissive = isActive ? color : '#000000';
  const actualEmissiveInt = isActive ? emissiveIntensity : 0;

  const validFillPct = Number.isFinite(fillPct) ? fillPct : 100;
  // Cap at 95% so there is always a visible surface/air gap at the top
  const safePct = Math.max(Math.min(validFillPct, 95), 1);
  const fillHeight = 3.38 * (safePct / 100);
  const fillY = -1.69 + (fillHeight / 2);

  return (
    <group position={position}>
      {/* Outer glow halo (only if active) */}
      {isActive && (
        <mesh ref={glowRef}>
          <cylinderGeometry args={[0.72, 0.72, 3.6, 64, 1, true]} />
          <meshBasicMaterial color={color} transparent opacity={0.13} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Cell body - Outer Glass */}
      <mesh ref={meshRef} castShadow>
        <cylinderGeometry args={[0.58, 0.58, 3.4, 64]} />
        <meshStandardMaterial
          color={isActive ? color : "#464646"}
          transparent={isActive}
          opacity={isActive ? 0.25 : 1}
          metalness={isActive ? 0.9 : 0.4}
          roughness={isActive ? 0.1 : 0.5}
          side={THREE.DoubleSide}
        />
        {!isActive && <Edges scale={1.0} threshold={15} color="#aaaaaa" />}
      </mesh>

      {/* Cell body - Inner Fill (Liquid) */}
      {isActive && (
        <mesh ref={fillRef} position={[0, fillY, 0]} castShadow>
          <cylinderGeometry args={[0.55, 0.55, fillHeight, 64]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={actualEmissiveInt}
            metalness={0.5}
            roughness={0.2}
          />
        </mesh>
      )}

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
function CellOverlay({ position, label, subLabel, colorHex, isVisible, voltage }) {
  return (
    <Html position={position} center={false} style={{ pointerEvents: 'none', opacity: isVisible ? 1 : 0, transition: 'opacity 0.3s ease', zIndex: 10 }}>
      <div style={{
        width: 200,
        fontFamily: "'JetBrains Mono', monospace",
        userSelect: 'none',
      }}>
        {/* Label + Text Data */}
        <div style={{
          background: 'rgba(0,0,0,0.7)',
          border: `1px solid ${colorHex}55`,
          borderRadius: 8,
          padding: '10px 14px',
          backdropFilter: 'blur(10px)',
          boxShadow: `0 4px 15px rgba(0,0,0,0.5)`
        }}>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 11, marginBottom: 4, letterSpacing: '0.05em' }}>{label}</div>
          {voltage !== null && (
            <div style={{ color: colorHex, fontSize: 18, fontWeight: 900, marginBottom: 2, textShadow: `0 0 8px ${colorHex}88` }}>
              {voltage.toFixed(2)}V
            </div>
          )}
          <div style={{ color: voltage !== null ? 'rgba(255,255,255,0.5)' : colorHex, fontSize: 12, fontWeight: 700 }}>
            {subLabel}
          </div>
        </div>
      </div>
    </Html>
  );
}

// ─── 3D Scene ────────────────────────────────────────────────────────────────
const getCellTemperature = (r, c, temp1, temp2) => {
  const maxTemp = Math.max(temp1, temp2, 25);
  const minTemp = Math.max(20, Math.min(temp1, temp2, 25) - 5);
  const dist = Math.abs(c - 1.5);
  const maxDist = 1.5;
  const ratio = 1 - (dist / maxDist);
  return minTemp + (maxTemp - minTemp) * ratio;
};

const getThermalColor = (temp) => {
  const minT = 20;
  const maxT = 60;
  const t = Math.max(0, Math.min(1, (temp - minT) / (maxT - minT)));
  const hue = (1 - t) * 120;
  return `hsl(${hue}, 100%, 50%)`;
};

function Scene({ data, viewMode }) {
  const [hoveredCell, setHoveredCell] = useState(null);

  const getCellColor = (v) => v < 3.85 ? '#D32F2F' : '#FFCC00';

  const rows = 5;
  const cols = 4;
  const spacingX = 1.6;
  const spacingZ = 1.6;
  const cells = [];

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = (c - (cols - 1) / 2) * spacingX;
      const z = ((rows - 1) / 2 - r) * spacingZ;
      let isActive = (r === 0);
      const id = r * cols + c + 1;

      let val = 0;
      let color = '#444';
      let label = `Cell ${c + 1}`;
      let dvdt = '-0.002';

      if (viewMode === 'thermal') {
        if (isActive) {
          const temp = getCellTemperature(r, c, data?.temp1 ?? 25, data?.temp2 ?? 25);
          color = getThermalColor(temp);
          val = temp;
          label = `Cell T: ${temp.toFixed(1)}°C`;
          dvdt = '0.00';
        }
      } else {
        if (isActive) {
          if (c === 0) { val = data?.cell1 ?? 0; dvdt = '-0.002'; }
          if (c === 1) { val = data?.cell2 ?? 0; dvdt = '-0.001'; }
          if (c === 2) { val = data?.cell3 ?? 0; dvdt = '-0.050'; }
          if (c === 3) { val = data?.cell4 ?? 0; dvdt = '-0.003'; }
          color = getCellColor(val);
        }
      }

      cells.push({ id, x, z, isActive, c, val, color, label, dvdt });
    }
  }

  return (
    <>
      <color attach="background" args={['#F8FAFC']} />
      <ambientLight intensity={0.4} />
      <pointLight position={[-4, 4, 3]} intensity={2.5} color="#3253DC" />
      <pointLight position={[4, 4, 3]} intensity={2.5} color="#E32526" />
      <pointLight position={[0, -4, 2]} intensity={0.5} color="#ffffff" />
      <Environment preset="studio" />

      {/* High-tech floor grid */}
      <Grid 
        args={[40, 40]} 
        position={[0, -1.8, 0]} 
        cellColor="#CBD5E1" 
        sectionColor="#3253DC" 
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
            fillPct={viewMode === 'voltage' ? Math.max(0, Math.min(100, ((cell.val - 3.0) / 1.12) * 100)) : 100}
          />
          {cell.isActive && (
            <CellOverlay
              position={[0.7, 1.2, 0]}
              label={cell.label}
              subLabel={viewMode === 'thermal' ? `${cell.val.toFixed(1)} °C` : `dV/dt = ${cell.dvdt} V/s`}
              colorHex={cell.color}
              isVisible={hoveredCell === cell.id}
              voltage={viewMode === 'voltage' ? cell.val : null}
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

// ─── Realistic EV Skateboard Battery Pack ────────────────────────────────────
function EVSkateboardPack({ data, viewMode }) {
  // Big enough to fill the car's wheelbase underfloor
  const moduleW = 1.10;  // wide module
  const moduleD = 0.70;  // deep module
  const moduleH = 0.18;  // flat height
  const gapX    = 0.08;
  const gapZ    = 0.08;
  const cols    = 2;
  const rows    = 5;   // 5 rows to span bumper-to-bumper

  const cellVals = [data?.cell1 ?? 4.0, data?.cell2 ?? 4.0, data?.cell3 ?? 4.0, data?.cell4 ?? 4.0];
  const temp1 = data?.temp1 ?? 25;
  const temp2 = data?.temp2 ?? 25;

  const getModuleColor = (idx) => {
    if (viewMode === 'thermal') {
      const temp = idx < 4 ? temp1 : temp2;
      const t = Math.max(0, Math.min(1, (temp - 20) / 40));
      return `hsl(${(1 - t) * 120}, 90%, 40%)`;
    }
    const v = cellVals[idx % 4];
    return v < 3.85 ? '#c0392b' : '#b0c4d8';
  };

  const modules = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const idx = r * cols + c;
      const x = (c - (cols - 1) / 2) * (moduleW + gapX);
      const z = (r - (rows - 1) / 2) * (moduleD + gapZ);
      modules.push({ idx, x, z });
    }
  }

  const trayW = cols * moduleW + (cols - 1) * gapX + 0.22;
  const trayD = rows * moduleD + (rows - 1) * gapZ + 0.22;
  const trayH = 0.08;

  // Positioned to sit INSIDE the car floor (raised up from ground)
  return (
    <group position={[0, -0.88, 0]}>
      {/* Bottom tray / enclosure */}
      <mesh position={[0, -trayH / 2, 0]}>
        <boxGeometry args={[trayW, trayH, trayD]} />
        <meshStandardMaterial color="#8c9aaa" metalness={0.95} roughness={0.25} />
      </mesh>
      {/* Tray walls */}
      {[
        { pos: [0, moduleH/2, -(trayD/2)+0.025],  size: [trayW, moduleH+0.05, 0.05] },
        { pos: [0, moduleH/2,  (trayD/2)-0.025],  size: [trayW, moduleH+0.05, 0.05] },
        { pos: [-(trayW/2)+0.025, moduleH/2, 0],  size: [0.05, moduleH+0.05, trayD] },
        { pos: [ (trayW/2)-0.025, moduleH/2, 0],  size: [0.05, moduleH+0.05, trayD] },
      ].map((w, i) => (
        <mesh key={i} position={w.pos}>
          <boxGeometry args={w.size} />
          <meshStandardMaterial color="#7a8899" metalness={0.95} roughness={0.2} />
        </mesh>
      ))}
      {/* Battery modules */}
      {modules.map(({ idx, x, z }) => (
        <group key={idx} position={[x, 0, z]}>
          <mesh position={[0, moduleH / 2, 0]}>
            <boxGeometry args={[moduleW, moduleH, moduleD]} />
            <meshStandardMaterial
              color={getModuleColor(idx)}
              metalness={0.6} roughness={0.35}
              emissive={getModuleColor(idx)}
              emissiveIntensity={viewMode === 'thermal' || cellVals[idx % 4] < 3.85 ? 0.3 : 0.05}
            />
          </mesh>
          {/* Top face gloss */}
          <mesh position={[0, moduleH + 0.002, 0]}>
            <boxGeometry args={[moduleW - 0.03, 0.005, moduleD - 0.03]} />
            <meshStandardMaterial 
              color={getModuleColor(idx)} 
              metalness={0.9} roughness={0.1} 
              emissive={getModuleColor(idx)}
              emissiveIntensity={viewMode === 'thermal' || cellVals[idx % 4] < 3.85 ? 0.4 : 0.05}
            />
          </mesh>
          {/* Vents across top */}
          {[-0.3, -0.1, 0.1, 0.3].map((vx, vi) => (
            <mesh key={vi} position={[vx, moduleH + 0.006, 0]}>
              <boxGeometry args={[0.025, 0.006, moduleD - 0.06]} />
              <meshStandardMaterial 
                color={viewMode === 'thermal' ? getModuleColor(idx) : "#4a5a6a"} 
                metalness={0.9} roughness={0.1} 
                emissive={viewMode === 'thermal' ? getModuleColor(idx) : "#000000"}
                emissiveIntensity={viewMode === 'thermal' ? 0.3 : 0}
              />
            </mesh>
          ))}
        </group>
      ))}
      {/* Orange HV busbar — longitudinal spine */}
      <mesh position={[0, moduleH + 0.025, 0]}>
        <boxGeometry args={[0.07, 0.03, trayD - 0.12]} />
        <meshStandardMaterial color="#e05a00" metalness={0.7} roughness={0.2} emissive="#ff4400" emissiveIntensity={0.5} />
      </mesh>
      {/* Orange HV busbars — cross connectors between rows */}
      {Array.from({ length: rows - 1 }).map((_, bi) => {
        const bz = ((bi) - (rows - 2) / 2) * (moduleD + gapZ);
        return (
          <mesh key={bi} position={[0, moduleH + 0.025, bz + (moduleD + gapZ) / 2]}>
            <boxGeometry args={[trayW - 0.12, 0.03, 0.065]} />
            <meshStandardMaterial color="#e05a00" metalness={0.7} roughness={0.2} emissive="#ff4400" emissiveIntensity={0.5} />
          </mesh>
        );
      })}
      {/* Front BMS / connector block */}
      <mesh position={[0, moduleH + 0.03, -(trayD / 2) + 0.03]}>
        <boxGeometry args={[0.25, 0.08, 0.10]} />
        <meshStandardMaterial color="#e05a00" metalness={0.8} roughness={0.2} emissive="#ff4400" emissiveIntensity={0.6} />
      </mesh>
      {/* Blue cooling plate */}
      <mesh position={[0, -0.01, 0]}>
        <boxGeometry args={[trayW - 0.08, 0.02, trayD - 0.08]} />
        <meshStandardMaterial color="#1a5a8a" metalness={0.9} roughness={0.3} />
      </mesh>
    </group>
  );
}

// ─── Car Model Scene ─────────────────────────────────────────────────────────
function CarModel({ data, viewMode }) {
  const { scene } = useGLTF('/ev_car.glb');

  useMemo(() => {
    scene.traverse((child) => {
      if (child.isMesh) {
        // Hide exhaust/muffler meshes since EVs don't have them
        const name = child.name.toLowerCase();
        if (name.includes('exhaust') || name.includes('muffler') || name.includes('tailpipe') || name.includes('pipe')) {
          child.visible = false;
          return;
        }

        if (child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            mat.transparent      = true;
            mat.opacity          = 0.18;
            mat.depthWrite       = false;
            mat.color            = new THREE.Color('#a8c8ff');
            mat.emissive         = new THREE.Color('#3253DC');
            mat.emissiveIntensity= 0.35;
            mat.metalness        = 0.9;
            mat.roughness        = 0.05;
            mat.side             = THREE.DoubleSide;
            mat.needsUpdate      = true;
          });
        }
      }
    });
  }, [scene]);

  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 10, 5]}  intensity={1.5} />
      <directionalLight position={[-5, 8, -5]} intensity={0.8} />
      <pointLight position={[0, 5,  4]} intensity={2.0} color="#3253DC" />
      <pointLight position={[0, 2, -4]} intensity={1.5} color="#60a5fa" />
      <pointLight position={[4, 1,  0]} intensity={1.0} color="#818cf8" />
      <Environment preset="city" />

      <Grid args={[40, 40]} position={[0, -1.6, 0]}
        cellColor="#CBD5E1" sectionColor="#3253DC"
        fadeDistance={28} fadeStrength={1.5}
        cellThickness={0.5} sectionThickness={1.2}
      />

      <primitive object={scene} position={[0, -1.2, 0]} scale={[2.2, 2.2, 2.2]} />
      <EVSkateboardPack data={data} viewMode={viewMode} />

      <OrbitControls
        enablePan={false}
        minDistance={3}
        maxDistance={24}
        minPolarAngle={0}
        maxPolarAngle={Math.PI / 2.1}
      />
    </>
  );
}

function CarViewScene({ data, viewMode }) {
  return (
    <Canvas camera={{ position: [0, 4, 14], fov: 50 }} style={{ width: '100%', height: '100%' }}
      gl={{ antialias: true, alpha: false }}>
      <Suspense fallback={
        <Html center>
          <div style={{ color: '#3253DC', fontSize: 14, fontWeight: 700, fontFamily: 'monospace' }}>Loading car model...</div>
        </Html>
      }>
        <CarModel data={data} viewMode={viewMode} />
      </Suspense>
    </Canvas>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function DigitalTwin({ data, history = [], connected }) {
  const [viewMode, setViewMode] = useState('voltage'); // 'voltage' | 'thermal' | 'car'

  // Build healthy & weak history series from live history
  const healthyHistory = useMemo(() =>
    history.slice(-30).map(h => ({ v: h.cell1 ?? 0 })), [history]);

  const weakHistory = useMemo(() => {
    return history.slice(-30).map((h, i) => ({
      v: h.cell3 ?? 0,
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
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ background: 'var(--surface-2)', padding: 4, borderRadius: 8, display: 'flex', gap: 4, border: '1px solid var(--border)' }}>
            {[
              { id: 'voltage', label: '⚡ Voltage View' },
              { id: 'thermal', label: '🌡 Thermal Heatmap' },
            ].map(btn => (
              <button key={btn.id}
                onClick={() => setViewMode(btn.id)}
                style={{ padding: '6px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                  background: viewMode === btn.id ? 'var(--blue)' : 'transparent',
                  color: viewMode === btn.id ? '#fff' : 'var(--text-2)',
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s' }}
              >{btn.label}</button>
            ))}
          </div>
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
        <div className="card" style={{ overflow: 'hidden', background: '#0a0a14', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ height: 'calc(100vh - 200px)', minHeight: 600, position: 'relative' }}>
            <CarViewScene data={data} viewMode={viewMode} />

            {/* Corner labels / Heatmap Legend */}
            {viewMode === 'thermal' && (
              <div style={{ position: 'absolute', right: 20, top: '50%', transform: 'translateY(-50%)', display: 'flex', alignItems: 'center', gap: 12, pointerEvents: 'none' }}>
                <div style={{ height: 200, display: 'grid', gridTemplateColumns: '40px 1fr', gap: 10 }}>
                  <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: 200, color: 'var(--text)', fontSize: 11, fontFamily: 'var(--mono)', fontWeight: 600 }}>
                    <span>60°C</span><span>40°C</span><span>20°C</span>
                  </div>
                  <div style={{ width: 12, height: 200, borderRadius: 6, background: 'linear-gradient(to top, hsl(120,100%,50%), hsl(60,100%,50%), hsl(0,100%,50%))', border: '1px solid var(--border)' }} />
                </div>
              </div>
            )}
            {viewMode === 'voltage' && (
              <div style={{ position: 'absolute', top: 14, left: 16, display: 'flex', gap: 10, pointerEvents: 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#b0c4d8', boxShadow: '0 0 6px #b0c4d8' }} />
                  <span style={{ color: '#b0c4d8', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)' }}>HEALTHY MODULE</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(4px)', padding: '4px 10px', borderRadius: 6, border: '1px solid rgba(255,255,255,0.2)' }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#c0392b', boxShadow: '0 0 6px #c0392b' }} />
                  <span style={{ color: '#c0392b', fontSize: 11, fontWeight: 700, fontFamily: 'var(--mono)' }}>WEAK MODULE</span>
                </div>
              </div>
            )}
            
            <div style={{ position: 'absolute', top: 14, right: viewMode === 'thermal' ? 60 : 16, pointerEvents: 'none' }}>
              <div style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)', border: '1px solid rgba(50,83,220,0.4)', borderRadius: 8, padding: '6px 12px' }}>
                <span style={{ color: '#3253DC', fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>🚗 LIVE VEHICLE DIGITAL TWIN</span>
              </div>
            </div>

            <div style={{ position: 'absolute', bottom: 12, right: 14, color: 'rgba(255,255,255,0.35)', fontSize: 10, fontFamily: 'var(--mono)', pointerEvents: 'none' }}>
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
                { label: 'State of Charge (SoC)', value: `${(data?.soc ?? 100).toFixed(1)} %`, color: 'var(--blue)' },
                { label: 'State of Health (SoH)', value: `${(data?.soh ?? 98.2).toFixed(1)} %`, color: 'var(--green)' },
                { label: 'Active Cell Count', value: `${data?.activeCells ?? 4} / 4`, color: 'var(--blue)' },
                { label: 'Current Charge Status', value: data?.chargeStatus ?? 'Idle', color: 'var(--blue)' },
                { label: 'TinyML Diagnostics', value: data?.mlOp ?? 'NORMAL', color: data?.mlOp === 'NORMAL' ? 'var(--green)' : 'var(--red)' },
                { label: 'Safety Anomaly Score', value: `${(data?.batteryScore ?? 100.0).toFixed(1)} %`, color: 'var(--amber)' },
                { label: 'J1939 SPN / FMI Code', value: data?.spn ? `SPN ${data.spn} / FMI ${data.fmi}` : '0 / 0 (No Fault)', color: data?.spn ? 'var(--red)' : 'var(--text-3)' },
              ].map(m => (
                <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 11.5, color: 'var(--text-3)' }}>{m.label}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, fontFamily: 'var(--mono)', color: m.color }}>{m.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-2)', borderBottom: '1px solid var(--border)', paddingBottom: 6 }}>Relay Status Matrix</span>
              {[
                { key: 'relayIsolation', id: 'isolation', label: 'Isolation' },
                { key: 'relayCooling', id: 'cooling', label: 'Cooler Fan' },
                { key: 'relayCell1', id: 'cell1', label: 'Cell 1 Relay' },
                { key: 'relayCell2', id: 'cell2', label: 'Cell 2 Relay' },
                { key: 'relayCell3', id: 'cell3', label: 'Cell 3 Relay' },
                { key: 'relayCell4', id: 'cell4', label: 'Cell 4 Relay' },
              ].map(r => {
                const state = data?.[r.key] ?? 'CONNECTED';
                const isConnected = state === 'CONNECTED';
                return (
                  <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 11.5 }}>
                    <span style={{ color: 'var(--text-3)' }}>{r.label}</span>
                    <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                      <span className={`badge ${!connected ? 'badge-secondary' : isConnected ? 'badge-green' : 'badge-red'}`} style={{ fontSize: 9, opacity: !connected ? 0.6 : 1 }}>
                        {!connected ? 'OFFLINE' : state}
                      </span>
                      <button
                        disabled={!connected}
                        style={{
                          padding: '2px 6px', fontSize: 9, background: !connected ? 'var(--surface-3)' : isConnected ? 'var(--red)' : 'var(--green)',
                          color: !connected ? 'var(--text-4)' : 'white', border: 'none', borderRadius: 4, cursor: !connected ? 'not-allowed' : 'pointer',
                          opacity: !connected ? 0.5 : 1
                        }}
                        onClick={async () => {
                          await fetch('/api/system/relay', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ relay: r.id, action: isConnected ? 'DISCONNECT' : 'CONNECT' })
                          });
                        }}
                      >
                        {isConnected ? 'Turn Off' : 'Turn On'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
