'use client';

import { useMemo, useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// ============================================================
// Procedural PCB-trace scene: routed traces with 45° bends,
// via dots, and light pulses travelling along the copper.
// ============================================================

const TRACE_COUNT = 110;
const SIGNAL_COUNT = 18;
const GRID = 0.13;
const BOARD_HALF = 3.4;

// PCB routing directions: orthogonal + 45° diagonals
const DIRECTIONS = [
  [1, 0],
  [0, 1],
  [-1, 0],
  [0, -1],
  [1, 1],
  [-1, -1],
  [1, -1],
  [-1, 1],
] as const;

interface Trace {
  points: THREE.Vector3[];
  cumulative: number[];
  total: number;
}

function buildTraces(): Trace[] {
  const traces: Trace[] = [];

  for (let i = 0; i < TRACE_COUNT; i++) {
    const points: THREE.Vector3[] = [];
    let x = Math.round(((Math.random() - 0.5) * 2 * BOARD_HALF) / GRID) * GRID;
    let y = Math.round(((Math.random() - 0.5) * 2 * BOARD_HALF) / GRID) * GRID;
    let dir = Math.floor(Math.random() * DIRECTIONS.length);
    points.push(new THREE.Vector3(x, y, 0));

    const segments = 3 + Math.floor(Math.random() * 6);
    for (let s = 0; s < segments; s++) {
      const run = (1 + Math.floor(Math.random() * 5)) * GRID;
      x += DIRECTIONS[dir][0] * run;
      y += DIRECTIONS[dir][1] * run;
      x = Math.max(-BOARD_HALF, Math.min(BOARD_HALF, x));
      y = Math.max(-BOARD_HALF, Math.min(BOARD_HALF, y));
      points.push(new THREE.Vector3(x, y, 0));
      // Turn by ±45° like a real autorouter
      dir = (dir + (Math.random() > 0.5 ? 1 : DIRECTIONS.length - 1)) % DIRECTIONS.length;
    }

    const cumulative = [0];
    for (let p = 1; p < points.length; p++) {
      cumulative.push(cumulative[p - 1] + points[p].distanceTo(points[p - 1]));
    }
    const total = cumulative[cumulative.length - 1];
    if (total > GRID * 2) {
      traces.push({ points, cumulative, total });
    }
  }

  return traces;
}

function TraceLines({ traces }: { traces: Trace[] }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (const trace of traces) {
      for (let i = 0; i < trace.points.length - 1; i++) {
        positions.push(
          trace.points[i].x, trace.points[i].y, trace.points[i].z,
          trace.points[i + 1].x, trace.points[i + 1].y, trace.points[i + 1].z
        );
      }
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [traces]);

  return (
    <lineSegments geometry={geometry}>
      <lineBasicMaterial
        color="#2f7fb8"
        transparent
        opacity={0.32}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </lineSegments>
  );
}

function Vias({ traces }: { traces: Trace[] }) {
  const geometry = useMemo(() => {
    const positions: number[] = [];
    for (const trace of traces) {
      const first = trace.points[0];
      const last = trace.points[trace.points.length - 1];
      positions.push(first.x, first.y, first.z, last.x, last.y, last.z);
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    return geo;
  }, [traces]);

  return (
    <points geometry={geometry}>
      <pointsMaterial
        color="#67b7e8"
        size={0.035}
        transparent
        opacity={0.75}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function Signals({ traces }: { traces: Trace[] }) {
  const pointsRef = useRef<THREE.Points>(null);

  const signals = useMemo(
    () =>
      Array.from({ length: SIGNAL_COUNT }, () => ({
        trace: Math.floor(Math.random() * traces.length),
        offset: Math.random(),
        speed: 0.04 + Math.random() * 0.09,
      })),
    [traces]
  );

  const positions = useMemo(() => new Float32Array(SIGNAL_COUNT * 3), []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    for (let i = 0; i < signals.length; i++) {
      const signal = signals[i];
      const trace = traces[signal.trace];
      const distance = ((signal.offset + t * signal.speed) % 1) * trace.total;

      let seg = 0;
      while (
        seg < trace.cumulative.length - 2 &&
        trace.cumulative[seg + 1] < distance
      ) {
        seg++;
      }
      const start = trace.cumulative[seg];
      const end = trace.cumulative[seg + 1];
      const p0 = trace.points[seg];
      const p1 = trace.points[seg + 1];
      const f = end > start ? (distance - start) / (end - start) : 0;

      positions[i * 3] = p0.x + (p1.x - p0.x) * f;
      positions[i * 3 + 1] = p0.y + (p1.y - p0.y) * f;
      positions[i * 3 + 2] = 0;
    }
    if (pointsRef.current) {
      const attr = pointsRef.current.geometry.attributes.position;
      attr.needsUpdate = true;
    }
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        color="#d9f2ff"
        size={0.06}
        transparent
        opacity={0.95}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        sizeAttenuation
      />
    </points>
  );
}

function Board() {
  const groupRef = useRef<THREE.Group>(null);
  const traces = useMemo(buildTraces, []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;
    group.rotation.z += delta * 0.02;
    // Gentle parallax toward pointer
    const targetX = -1.05 + state.pointer.y * 0.06;
    const targetY = state.pointer.x * 0.1;
    group.rotation.x += (targetX - group.rotation.x) * 0.04;
    group.rotation.y += (targetY - group.rotation.y) * 0.04;
  });

  return (
    <group ref={groupRef} rotation={[-1.05, 0, 0]} position={[0, -0.4, 0]}>
      <TraceLines traces={traces} />
      <Vias traces={traces} />
      <Signals traces={traces} />
    </group>
  );
}

export default function CircuitScene() {
  return (
    <Canvas
      camera={{ position: [0, 0.7, 3.1], fov: 52 }}
      dpr={[1, 2]}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ background: 'transparent' }}
    >
      <fog attach="fog" args={['#05070b', 2.4, 6.5]} />
      <Board />
    </Canvas>
  );
}
