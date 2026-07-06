import { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

// Highly visible wireframe globe representing global machine deployments
function HoloGlobe() {
  const globeRef = useRef();
  
  useFrame((state, delta) => {
    if (globeRef.current) {
      globeRef.current.rotation.y += delta * 0.1;
      globeRef.current.rotation.z = Math.sin(state.clock.elapsedTime * 0.2) * 0.1;
    }
  });

  return (
    <group ref={globeRef} position={[15, 0, -10]}>
      {/* Core light sphere */}
      <mesh>
        <sphereGeometry args={[18, 64, 64]} />
        <meshBasicMaterial color="#F1F5F9" />
      </mesh>
      
      {/* Glowing blue wireframe representing the digital grid */}
      <mesh>
        <sphereGeometry args={[18.1, 32, 32]} />
        <meshBasicMaterial color="#3253DC" wireframe transparent opacity={0.15} />
      </mesh>

      {/* Secondary intricate wireframe for technical depth */}
      <mesh>
        <icosahedronGeometry args={[18.5, 2]} />
        <meshBasicMaterial color="#3253DC" wireframe transparent opacity={0.08} />
      </mesh>
    </group>
  );
}

// Data nodes orbiting the globe (representing active remote machines)
function OrbitingNodes() {
  const groupRef = useRef();
  const nodeCount = 40;
  
  // Pre-compute random orbit rings
  const nodes = useMemo(() => {
    return Array.from({ length: nodeCount }).map(() => ({
      radius: 19 + Math.random() * 5,
      speed: (Math.random() - 0.5) * 0.5,
      angle: Math.random() * Math.PI * 2,
      yPos: (Math.random() - 0.5) * 20,
      size: 0.05 + Math.random() * 0.1 // Much smaller, subtle data points
    }));
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.children.forEach((child, i) => {
        const data = nodes[i];
        data.angle += data.speed * delta;
        child.position.x = Math.cos(data.angle) * data.radius;
        child.position.z = Math.sin(data.angle) * data.radius;
      });
    }
  });

  return (
    <group ref={groupRef} position={[15, 0, -10]}>
      {nodes.map((n, i) => (
        <mesh key={i} position={[0, n.yPos, 0]}>
          <sphereGeometry args={[n.size, 8, 8]} />
          <meshBasicMaterial color={i % 5 === 0 ? "#10B981" : "#3253DC"} />
        </mesh>
      ))}
    </group>
  );
}

// Background atmospheric data streams
function DataStreams() {
  const streamRef = useRef();
  const count = 150;
  
  const positions = useMemo(() => {
    const pos = new Float32Array(count * 3);
    for(let i = 0; i < count * 3; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 1] = (Math.random() - 0.5) * 100;
      pos[i * 3 + 2] = -30 - Math.random() * 50;
    }
    return pos;
  }, []);

  useFrame((state) => {
    if (streamRef.current) {
      streamRef.current.position.x = (state.clock.elapsedTime * 10) % 50;
    }
  });

  return (
    <points ref={streamRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" count={count} array={positions} itemSize={3} />
      </bufferGeometry>
      <pointsMaterial size={0.4} color="#3253AC" transparent opacity={0.3} />
    </points>
  );
}

export default function Background3D() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', background: 'var(--bg)' }}>
      <Canvas camera={{ position: [0, 0, 30], fov: 50 }}>
        <ambientLight intensity={0.5} />
        
        <HoloGlobe />
        <OrbitingNodes />
        <DataStreams />
        
        <Environment preset="city" />
      </Canvas>
      {/* Very soft gradient to ensure UI readability */}
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, rgba(248,250,252,0.9) 0%, rgba(248,250,252,0.4) 100%)' }} />
    </div>
  );
}
