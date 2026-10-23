import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { canvasTexture, crateTexture, HORIZON, mulberry32, SAND, TRIM, WALL, WOOD } from './materials';
import { Sky } from './Sky';

// An original low-poly desert town (no game assets), laid out like the SVG fallback:
// arched wall with doors, a painted "A" sign, stacked crates, far buildings, dust in the air.
// Loaded lazily, desktop only; see Background.tsx for the gating.

const signTexture = () =>
  canvasTexture(512, 256, (g) => {
    g.fillStyle = '#3c5a86';
    g.globalAlpha = 0.85;
    g.beginPath();
    g.moveTo(20, 100);
    g.lineTo(220, 100);
    g.lineTo(220, 50);
    g.lineTo(320, 128);
    g.lineTo(220, 206);
    g.lineTo(220, 156);
    g.lineTo(20, 156);
    g.closePath();
    g.fill();
    g.font = '200px Impact, "Arial Black", sans-serif';
    g.fillText('A', 350, 205);
  });

/** Wall outline with an arched doorway cut into the bottom edge. */
function archWallGeometry(width: number, height: number, archHalf: number, archSpring: number, depth: number) {
  const s = new THREE.Shape();
  s.moveTo(-width / 2, 0);
  s.lineTo(-archHalf, 0);
  s.lineTo(-archHalf, archSpring);
  s.absarc(0, archSpring, archHalf, Math.PI, 0, true);
  s.lineTo(archHalf, 0);
  s.lineTo(width / 2, 0);
  s.lineTo(width / 2, height);
  s.lineTo(-width / 2, height);
  s.closePath();
  return new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
}

function Ground() {
  const geometry = useMemo(() => {
    const g = new THREE.PlaneGeometry(140, 140, 70, 70);
    const pos = g.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      // gentle dunes, flat near the buildings
      const far = Math.min(1, Math.max(0, (-y - 6) / 20) + Math.max(0, (Math.abs(x) - 14) / 20));
      pos.setZ(i, (Math.sin(x * 0.35) * Math.cos(y * 0.28) * 0.35 + Math.sin(x * 0.9 + y) * 0.06) * far);
    }
    g.computeVertexNormals();
    return g;
  }, []);
  return (
    <mesh geometry={geometry} rotation-x={-Math.PI / 2} receiveShadow>
      <meshStandardMaterial color={SAND} roughness={1} />
    </mesh>
  );
}

function Town() {
  const wall = useMemo(() => archWallGeometry(11, 5.5, 1.3, 2.6, 1), []);
  const crate = useMemo(crateTexture, []);
  const sign = useMemo(signTexture, []);
  const buildings = useMemo(() => {
    const rng = mulberry32(7);
    return Array.from({ length: 11 }, (_, i) => {
      const w = 3 + rng() * 4;
      const h = 3 + rng() * 5;
      return { x: -14 + i * 3.4 + rng() * 1.5, z: -15 - rng() * 8, w, h, d: 3 + rng() * 3, shade: rng() };
    });
  }, []);

  return (
    <group>
      {/* main wall with the arch, its trim, and a courtyard building seen through it */}
      <mesh geometry={wall} position={[4, 0, -3]} castShadow receiveShadow>
        <meshStandardMaterial color={WALL} roughness={0.95} />
      </mesh>
      <mesh position={[4, 5.65, -2.5]} castShadow>
        <boxGeometry args={[11.4, 0.35, 1.3]} />
        <meshStandardMaterial color={TRIM} roughness={0.9} />
      </mesh>
      <mesh position={[4, 2.2, -9]} castShadow receiveShadow>
        <boxGeometry args={[6, 4.4, 3]} />
        <meshStandardMaterial color="#d8b07a" roughness={1} />
      </mesh>

      {/* doors: one shut, one swung open */}
      <mesh position={[3.35, 1.45, -2.45]} castShadow>
        <boxGeometry args={[1.25, 2.9, 0.12]} />
        <meshStandardMaterial color={WOOD} roughness={0.8} />
      </mesh>
      <mesh position={[5.35, 1.45, -1.75]} rotation-y={-1.15} castShadow>
        <boxGeometry args={[1.25, 2.9, 0.12]} />
        <meshStandardMaterial color="#5f3f20" roughness={0.8} />
      </mesh>

      <mesh position={[1.1, 3.1, -1.98]}>
        <planeGeometry args={[2.6, 1.3]} />
        <meshStandardMaterial map={sign} transparent roughness={1} />
      </mesh>

      {/* shaded pillar on the left, behind the menu */}
      <mesh position={[-7, 4.5, 2]} castShadow receiveShadow>
        <boxGeometry args={[3, 9, 3]} />
        <meshStandardMaterial color="#7c5631" roughness={1} />
      </mesh>

      {/* crates */}
      {[
        [6.8, 0.7, 1.6, 0],
        [8.3, 0.7, 1.9, 0.2],
        [7.5, 2.1, 1.7, -0.12],
      ].map(([x, y, z, r]) => (
        <mesh key={`${x}-${y}`} position={[x, y, z]} rotation-y={r} castShadow receiveShadow>
          <boxGeometry args={[1.4, 1.4, 1.4]} />
          <meshStandardMaterial map={crate} roughness={0.85} />
        </mesh>
      ))}

      {/* distant town */}
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, b.h / 2, b.z]}>
          <mesh castShadow receiveShadow>
            <boxGeometry args={[b.w, b.h, b.d]} />
            <meshStandardMaterial color={b.shade > 0.5 ? '#d9b47c' : '#cfa56b'} roughness={1} />
          </mesh>
          <mesh position={[-b.w / 4, b.h / 4, b.d / 2 + 0.01]}>
            <planeGeometry args={[0.5, 0.7]} />
            <meshStandardMaterial color="#6e5232" roughness={1} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Dust({ count = 450 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null);
  const positions = useMemo(() => {
    const rng = mulberry32(3);
    const a = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      a[i * 3] = -12 + rng() * 28;
      a[i * 3 + 1] = rng() * 7;
      a[i * 3 + 2] = -8 + rng() * 16;
    }
    return a;
  }, [count]);

  useFrame(({ clock }, dt) => {
    const attr = ref.current?.geometry.attributes.position;
    if (!attr) return;
    const arr = attr.array as Float32Array;
    const t = clock.elapsedTime;
    for (let i = 0; i < count; i++) {
      arr[i * 3] += dt * (0.35 + (i % 5) * 0.08);
      arr[i * 3 + 1] += Math.sin(t * 0.7 + i) * dt * 0.06;
      if (arr[i * 3] > 16) arr[i * 3] = -12;
    }
    attr.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.045} color="#fff1d2" transparent opacity={0.6} depthWrite={false} />
    </points>
  );
}

/** Slow idle drift plus a little parallax toward the pointer (tracked on window, since the UI sits on top). */
function CameraRig() {
  const camera = useThree((s) => s.camera);
  const pointer = useRef({ x: 0, y: 0 });
  const target = useMemo(() => new THREE.Vector3(2.4, 2.7, -3), []);

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      pointer.current = { x: (e.clientX / window.innerWidth) * 2 - 1, y: -((e.clientY / window.innerHeight) * 2 - 1) };
    };
    window.addEventListener('pointermove', onMove);
    return () => window.removeEventListener('pointermove', onMove);
  }, []);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const x = Math.sin(t * 0.07) * 0.9 + pointer.current.x * 0.6;
    const y = 2.4 + Math.sin(t * 0.11) * 0.15 + pointer.current.y * 0.25;
    const z = 14 + Math.sin(t * 0.05) * 0.6;
    camera.position.x += (x - camera.position.x) * 0.03;
    camera.position.y += (y - camera.position.y) * 0.03;
    camera.position.z += (z - camera.position.z) * 0.03;
    camera.lookAt(target);
  });
  return null;
}

/** `still` (reduced motion): render a single frame, with no camera drift or moving dust. */
export default function Scene3D({ still, onReady }: { still: boolean; onReady: () => void }) {
  return (
    <Canvas
      frameloop={still ? 'demand' : 'always'}
      shadows
      dpr={[1, 1.75]}
      camera={{ fov: 45, position: [0, 2.4, 14], near: 0.1, far: 200 }}
      gl={{ antialias: true, powerPreference: 'high-performance', toneMappingExposure: 1.2 }}
      onCreated={onReady}
    >
      <fog attach="fog" args={[HORIZON, 22, 70]} />
      <hemisphereLight args={['#ffe6bd', '#8a6a42', 1]} />
      <directionalLight
        position={[10, 13, 12]}
        intensity={2.8}
        color="#fff0d6"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-16}
        shadow-camera-right={16}
        shadow-camera-top={14}
        shadow-camera-bottom={-10}
        shadow-bias={-0.0004}
      />
      <Sky />
      <Ground />
      <Town />
      <Dust />
      <CameraRig />
    </Canvas>
  );
}
