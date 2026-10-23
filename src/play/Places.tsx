import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type * as THREE from 'three';
import { crateTexture } from '../components/scene/materials';
import { PICKUPS, SIGNS } from './map';
import { pickupLabel, signTexture } from './signs';

/** Re-draw canvas textures once web fonts (stencil, mono) have loaded. */
function useFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    document.fonts.ready.then(() => alive && setReady(true));
    return () => {
      alive = false;
    };
  }, []);
  return ready;
}

function Signs() {
  const fonts = useFontsReady();
  // eslint-disable-next-line react-hooks/exhaustive-deps -- `fonts` only triggers a redraw
  const textures = useMemo(() => SIGNS.map((s) => signTexture(s.content)), [fonts]);
  return (
    <>
      {SIGNS.map((s, i) => (
        <mesh key={i} position={s.position} rotation={s.flat ? [-Math.PI / 2, 0, 0] : [0, s.rotationY, 0]} receiveShadow>
          <planeGeometry args={s.size} />
          <meshStandardMaterial map={textures[i]} transparent={s.content.type === 'letter'} roughness={0.9} polygonOffset polygonOffsetFactor={-1} />
        </mesh>
      ))}
    </>
  );
}

/** A glowing, spinning crate with a label that always faces the player. Walk into it to pick it up. */
function Pickup({ x, z, label }: { x: number; z: number; label: string }) {
  const crate = useRef<THREE.Mesh>(null);
  const tag = useRef<THREE.Mesh>(null);
  const crateMap = useMemo(crateTexture, []);
  const labelMap = useMemo(() => pickupLabel(label), [label]);

  useFrame(({ clock, camera }) => {
    const t = clock.elapsedTime;
    if (crate.current) {
      crate.current.rotation.y = t * 1.2;
      crate.current.position.y = 0.75 + Math.sin(t * 2 + x) * 0.08;
    }
    tag.current?.quaternion.copy(camera.quaternion);
  });

  return (
    <group position={[x, 0, z]}>
      <mesh ref={crate} castShadow>
        <boxGeometry args={[0.6, 0.6, 0.6]} />
        <meshStandardMaterial map={crateMap} emissive="#ffa01e" emissiveIntensity={0.35} />
      </mesh>
      <mesh ref={tag} position={[0, 1.55, 0]}>
        <planeGeometry args={[0.9, 0.34]} />
        <meshBasicMaterial map={labelMap} transparent depthWrite={false} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color="#ffb04a" intensity={2} distance={3} />
    </group>
  );
}

export function Places() {
  return (
    <>
      <Signs />
      {PICKUPS.map((p) => (
        <Pickup key={p.lang} x={p.x} z={p.z} label={`CV · ${p.lang}`} />
      ))}
    </>
  );
}
