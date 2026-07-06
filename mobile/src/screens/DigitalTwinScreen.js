import React, { useRef, useState, useMemo, Suspense } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView, Platform, PanResponder } from 'react-native';
import { Canvas, useFrame } from '@react-three/fiber/native';
import { useGLTF } from '@react-three/drei/native';
import * as THREE from 'three';
import { Ionicons } from '@expo/vector-icons';
import { C, S, R } from '../theme/colors';
import { API_URL } from '../config';

// ─── Realistic EV Skateboard Battery Pack (Mobile Version) ────────────────────
function EVSkateboardPack({ data, viewMode }) {
  const moduleW = 1.10;
  const moduleD = 0.70;
  const moduleH = 0.18;
  const gapX    = 0.08;
  const gapZ    = 0.08;
  const cols    = 2;
  const rows    = 5;

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



// ─── Car Model Wrapper ─────────────────────────────────────────
function CarModel({ data, viewMode }) {
  // Load the 98MB ev_car.glb (Warning: This may cause OutOfMemory errors on low-spec Android devices)
  const gltfUrl = require('../../assets/ev_car.glb');
  const { scene } = useGLTF(gltfUrl);

  useMemo(() => {
    if (scene) {
      scene.traverse((child) => {
        if (child.isMesh) {
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
    }
  }, [scene]);

  return (
    <>
      {/* Restored exact dimensions for ev_car.glb */}
      <primitive object={scene} position={[0, -1.2, 0]} scale={[2.2, 2.2, 2.2]} />
      {/* Flattened battery pack and moved it down to the vehicle floorboard */}
      <group position={[0, -1.5, 0]} scale={[1, 0.5, 1]}>
        <EVSkateboardPack data={data} viewMode={viewMode} />
      </group>
    </>
  );
}

// ─── 3D Scene Wrapper ────────────────────────────────
function Scene({ data, viewMode, rotationRef, zoomRef }) {
  const groupRef = useRef();

  useFrame((state) => {
    // Smoothly apply zoom
    if (zoomRef?.current) {
      state.camera.position.z = THREE.MathUtils.lerp(state.camera.position.z, zoomRef.current, 0.15);
    }
    // Smoothly apply manual rotation
    if (groupRef.current && rotationRef?.current) {
      groupRef.current.rotation.y = rotationRef.current.y;
      groupRef.current.rotation.x = rotationRef.current.x;
    }
  });

  return (
    <>
      <ambientLight intensity={1.2} />
      <directionalLight position={[5, 10, 7]} intensity={1.5} color="#ffffff" />
      <directionalLight position={[-5, 10, -7]} intensity={1.0} color="#ffffff" />
      <pointLight position={[-4, 4, 3]} intensity={2.0} color="#3253DC" />
      <pointLight position={[4, 4, 3]} intensity={2.0} color="#E32526" />
      <pointLight position={[0, -4, 2]} intensity={0.5} color="#ffffff" />
      
      <group ref={groupRef} position={[0, -0.5, 0]}>
        <Suspense fallback={null}>
          <CarModel data={data} viewMode={viewMode} />
        </Suspense>
      </group>
    </>
  );
}

// ─── Main Screen Component ───────────────────────────────────────────────────
export default function DigitalTwinScreen({ data, connected }) {
  const [viewMode, setViewMode] = useState('voltage');
  
  // Interaction Refs
  const rotationRef = useRef({ x: 0, y: 0 });
  const lastRotationRef = useRef({ x: 0, y: 0 });
  const zoomRef = useRef(9.0);
  const lastZoomDist = useRef(null);

  const panResponder = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dx) > 10 || Math.abs(gestureState.dy) > 10;
    },
    onPanResponderGrant: () => {
      lastRotationRef.current = { ...rotationRef.current };
      lastZoomDist.current = null; // Reset pinch distance tracking
    },
    onPanResponderMove: (e, gestureState) => {
      const touches = e.nativeEvent.touches;
      
      if (touches.length === 2) {
        // Pinch to Zoom
        const dx = touches[0].pageX - touches[1].pageX;
        const dy = touches[0].pageY - touches[1].pageY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        if (lastZoomDist.current === null) {
          lastZoomDist.current = dist;
        } else {
          // Calculate zoom delta
          const delta = (dist - lastZoomDist.current) * 0.05;
          // Clamp zoom between Z=4 and Z=22
          zoomRef.current = Math.max(4, Math.min(22, zoomRef.current - delta));
          lastZoomDist.current = dist;
        }
      } else if (touches.length === 1 && lastZoomDist.current === null) {
        // 1-Finger Orbit Rotation
        rotationRef.current = {
          x: lastRotationRef.current.x + (gestureState.dy * 0.01),
          y: lastRotationRef.current.y + (gestureState.dx * 0.01),
        };
        // Clamp vertical rotation
        rotationRef.current.x = Math.max(-Math.PI / 3, Math.min(Math.PI / 4, rotationRef.current.x));
      }
    },
    onPanResponderRelease: () => {
      lastZoomDist.current = null;
    }
  }), []);

  const statusColor = data?.status === 'Healthy' ? C.green : data?.status === 'Warning' ? C.amber : C.red;

  const handleRelayToggle = async (relayId, isConnected) => {
    try {
      await fetch(`${API_URL}/api/system/relay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ relay: relayId, action: isConnected ? 'DISCONNECT' : 'CONNECT' })
      });
    } catch (err) {
      console.log('Relay error:', err);
    }
  };

  return (
    <SafeAreaView style={ss.safe}>
      {/* Header */}
      <View style={ss.header}>
        <View>
          <Text style={ss.title}>3D Digital Twin</Text>
          <Text style={ss.subtitle}>Live physics-accurate rendering</Text>
        </View>
        <View style={ss.statusBadge}>
          <View style={[ss.dot, { backgroundColor: connected ? C.green : C.text4 }]} />
          <Text style={ss.statusText}>{connected ? 'LIVE SYNC' : 'OFFLINE'}</Text>
        </View>
      </View>

      {/* Scrollable Content Area */}
      <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingBottom: S.xxl }}>
        {/* 3D Canvas wrapper with custom PanResponder */}
        <View style={ss.canvasContainer} {...panResponder.panHandlers}>
          <Canvas
            camera={{ position: [0, 2.0, 9.0], fov: 45 }}
            gl={{ antialias: true, alpha: true }}
          >
            <Scene data={data} viewMode={viewMode} rotationRef={rotationRef} zoomRef={zoomRef} />
          </Canvas>

          {/* View Mode Toggle Overlay */}
          <View style={ss.toggleContainer}>
            <TouchableOpacity 
              style={[ss.toggleBtn, viewMode === 'voltage' && ss.toggleActive]} 
              onPress={() => setViewMode('voltage')}
            >
              <Text style={[ss.toggleText, viewMode === 'voltage' && ss.toggleTextActive]}>Voltage</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[ss.toggleBtn, viewMode === 'thermal' && ss.toggleActive]} 
              onPress={() => setViewMode('thermal')}
            >
              <Text style={[ss.toggleText, viewMode === 'thermal' && ss.toggleTextActive]}>Thermal</Text>
            </TouchableOpacity>
          </View>
          
          {/* Helper text */}
          <Text style={ss.helperText}>Swipe to orbit the pack</Text>
        </View>

        {/* Live Telemetry Card */}
        <View style={ss.card}>
          <View style={ss.cardHeader}>
            <Text style={ss.cardTitle}>Live Telemetry</Text>
          </View>
          <View style={ss.cardBody}>
            {[
              { label: 'State of Charge (SoC)', value: `${(data?.soc ?? 100).toFixed(1)} %`, color: C.blue },
              { label: 'State of Health (SoH)', value: `${(data?.soh ?? 98.2).toFixed(1)} %`, color: C.green },
              { label: 'Active Cell Count', value: `${data?.activeCells ?? 4} / 4`, color: C.blue },
              { label: 'Current Charge Status', value: data?.chargeStatus ?? 'Idle', color: C.blue },
              { label: 'TinyML Diagnostics', value: data?.mlOp ?? 'NORMAL', color: data?.mlOp === 'NORMAL' ? C.green : C.red },
              { label: 'Safety Anomaly Score', value: `${(data?.batteryScore ?? 100.0).toFixed(1)} %`, color: C.amber },
              { label: 'J1939 SPN / FMI Code', value: data?.spn ? `SPN ${data.spn} / FMI ${data.fmi}` : '0 / 0 (No Fault)', color: data?.spn ? C.red : C.text3 },
            ].map((m, i) => (
              <View key={m.label} style={[ss.telemetryRow, i === 0 && { borderTopWidth: 0 }]}>
                <Text style={ss.telemetryLabel}>{m.label}</Text>
                <Text style={[ss.telemetryValue, { color: m.color }]}>{m.value}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Relay Status Matrix */}
        <View style={ss.card}>
          <View style={ss.cardBody}>
            <Text style={ss.matrixTitle}>Relay Status Matrix</Text>
            {[
              { key: 'relayIsolation', id: 'isolation', label: 'Isolation' },
              { key: 'relayCooling', id: 'cooling', label: 'Cooler Fan' },
              { key: 'relayCell1', id: 'cell1', label: 'Cell 1 Relay' },
              { key: 'relayCell2', id: 'cell2', label: 'Cell 2 Relay' },
              { key: 'relayCell3', id: 'cell3', label: 'Cell 3 Relay' },
              { key: 'relayCell4', id: 'cell4', label: 'Cell 4 Relay' },
            ].map((r, i) => {
              const state = data?.[r.key] ?? 'CONNECTED';
              const isConnected = state === 'CONNECTED';
              return (
                <View key={r.id} style={ss.relayRow}>
                  <Text style={ss.relayLabel}>{r.label}</Text>
                  <View style={ss.relayControls}>
                    <View style={[ss.relayBadge, { backgroundColor: !connected ? C.surface3 : isConnected ? C.green + '22' : C.red + '22' }]}>
                      <Text style={[ss.relayBadgeText, { color: !connected ? C.text4 : isConnected ? C.green : C.red }]}>
                        {!connected ? 'OFFLINE' : state}
                      </Text>
                    </View>
                    <TouchableOpacity
                      disabled={!connected}
                      style={[ss.relayBtn, { backgroundColor: !connected ? C.surface3 : isConnected ? C.red : C.green }]}
                      onPress={() => handleRelayToggle(r.id, isConnected)}
                    >
                      <Text style={[ss.relayBtnText, { color: !connected ? C.text4 : C.white }]}>
                        {isConnected ? 'Turn Off' : 'Turn On'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            })}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const ss = StyleSheet.create({
  safe: { flex: 1, backgroundColor: 'transparent' },
  header: {
    padding: S.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: C.surface,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  title: { fontSize: 20, fontWeight: '800', color: C.text },
  subtitle: { fontSize: 13, color: C.text3, marginTop: 4 },
  statusBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: C.surface2, paddingHorizontal: 10, paddingVertical: 6, borderRadius: R.round,
    borderWidth: 1, borderColor: C.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: '700', color: C.text2 },
  
  canvasContainer: {
    height: 400,
    backgroundColor: 'transparent',
    position: 'relative',
    overflow: 'hidden'
  },
  toggleContainer: {
    position: 'absolute',
    top: 16,
    left: 16,
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderRadius: R.md,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  toggleBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: R.sm,
  },
  toggleActive: {
    backgroundColor: C.blue,
  },
  toggleText: {
    fontSize: 12, fontWeight: '600', color: C.text3,
  },
  toggleTextActive: {
    color: C.white,
  },
  helperText: {
    position: 'absolute',
    bottom: 16,
    alignSelf: 'center',
    fontSize: 11,
    color: 'rgba(0,0,0,0.4)'
  },

  card: {
    backgroundColor: C.surface,
    marginHorizontal: S.base,
    marginTop: S.base,
    borderRadius: R.lg,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },
  cardHeader: {
    padding: S.md,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.surface2,
  },
  cardTitle: { fontSize: 13, fontWeight: '700', color: C.text2 },
  cardBody: { padding: S.md },
  
  telemetryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  telemetryLabel: { fontSize: 12, color: C.text3 },
  telemetryValue: { fontSize: 14, fontWeight: '700' },

  matrixTitle: { fontSize: 13, fontWeight: '700', color: C.text2, marginBottom: S.md, paddingBottom: 6, borderBottomWidth: 1, borderBottomColor: C.border },
  relayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  relayLabel: { fontSize: 12, color: C.text3 },
  relayControls: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  relayBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  relayBadgeText: { fontSize: 9, fontWeight: '700' },
  relayBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 6 },
  relayBtnText: { fontSize: 10, fontWeight: '700' },
});
