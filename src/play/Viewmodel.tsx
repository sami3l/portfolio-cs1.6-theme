import { createPortal, useFrame, useLoader, useThree } from '@react-three/fiber';
import { Suspense, useEffect, useMemo, useRef, type RefObject } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { asset } from '../utils/format';
import { KNIFE, RIFLE, type PlayRuntime } from './runtime';

// First-person hands and weapons. The rifle and hands are "Low poly FPS rifle and hands" by
// Robin Lamb (CC0, opengameart.org) with its own fire animation; the knife is built from boxes.
// They live in their own scene, drawn after the world with a cleared depth buffer, so they
// never clip into walls, the way games do it.

const RIFLE_URL = asset('models/rifle.glb');
/** Model units → metres, and where the barrel tip sits in model space (for the muzzle flash). */
const RIFLE_SCALE = 0.055;
const MUZZLE: [number, number, number] = [0, 0.42, -6.7];

const SKIN = '#d9b37c';
const KNUCKLE = '#c49b64';
// Low metalness: with no environment map to reflect, a mirror-metal blade renders dark.
const BLADE = '#dfe2e6';

type Vec3 = [number, number, number];

function Part({ size, position, rotation, color, metal = 0.1, rough = 0.8 }: { size: Vec3; position: Vec3; rotation?: Vec3; color: string; metal?: number; rough?: number }) {
  return (
    <mesh position={position} rotation={rotation}>
      <boxGeometry args={size} />
      <meshStandardMaterial color={color} metalness={metal} roughness={rough} />
    </mesh>
  );
}

function MuzzleFlash({ flash }: { flash: RefObject<THREE.Group | null> }) {
  return (
    <group ref={flash} position={MUZZLE} scale={1 / RIFLE_SCALE} visible={false}>
      {[0, Math.PI / 2].map((r) => (
        <mesh key={r} rotation={[0, r, 0]}>
          <planeGeometry args={[0.08, 0.13]} />
          <meshBasicMaterial color="#ffd27a" transparent opacity={0.9} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[0.05, 8]} />
        <meshBasicMaterial color="#fff2c4" transparent opacity={0.85} blending={THREE.AdditiveBlending} depthWrite={false} toneMapped={false} side={THREE.DoubleSide} />
      </mesh>
      <pointLight color="#ffb04a" intensity={4} distance={1.2} />
    </group>
  );
}

/** The glTF rifle + hands, playing its "fire" clip on every shot. */
function Rifle({ runtime, flash }: { runtime: RefObject<PlayRuntime>; flash: RefObject<THREE.Group | null> }) {
  const gltf = useLoader(GLTFLoader, RIFLE_URL);
  const { mixer, fire } = useMemo(() => {
    gltf.scene.traverse((o) => {
      // Skinned meshes have stale bounds; never cull the viewmodel.
      o.frustumCulled = false;
      const mesh = o as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial | undefined;
      if (mat?.name === 'GunMaterial') {
        mat.color.set('#1d1e20'); // pure black reads as a hole on screen
        mat.metalness = 0.5;
        mat.roughness = 0.45;
      }
    });
    const m = new THREE.AnimationMixer(gltf.scene);
    const clip = gltf.animations.find((a) => a.name === 'fire');
    const action = clip ? m.clipAction(clip) : null;
    action?.setLoop(THREE.LoopOnce, 1);
    return { mixer: m, fire: action };
  }, [gltf]);
  const lastShot = useRef(0);

  useFrame((_, delta) => {
    const rt = runtime.current;
    if (rt.weapon === 'rifle' && rt.firedAt !== lastShot.current) {
      lastShot.current = rt.firedAt;
      fire?.reset().play();
    }
    mixer.update(delta);
  });

  return (
    <group scale={RIFLE_SCALE}>
      <primitive object={gltf.scene} />
      <MuzzleFlash flash={flash} />
    </group>
  );
}

function Knife() {
  return (
    <group>
      <Part size={[0.024, 0.032, 0.1]} position={[0, 0, 0.02]} color="#141414" rough={0.9} />
      <Part size={[0.014, 0.056, 0.01]} position={[0, 0.006, -0.035]} color="#3a3a3a" metal={0.6} rough={0.4} />
      <Part size={[0.006, 0.032, 0.17]} position={[0, 0.008, -0.125]} color={BLADE} metal={0.25} rough={0.3} />
      <Part size={[0.006, 0.022, 0.03]} position={[0, 0.016, -0.212]} rotation={[0.55, 0, 0]} color={BLADE} metal={0.25} rough={0.3} />
      {/* bare hand and forearm, matching the rifle model's hands */}
      <Part size={[0.068, 0.078, 0.088]} position={[0.008, -0.012, 0.026]} color={SKIN} />
      <Part size={[0.06, 0.03, 0.03]} position={[0.004, -0.008, -0.02]} color={KNUCKLE} />
      <group position={[0.012, -0.03, 0.08]} rotation={[0.85, 0.3, 0]}>
        <Part size={[0.058, 0.062, 0.34]} position={[0, 0, 0.17]} color={SKIN} />
      </group>
    </group>
  );
}

const easeOut = (k: number) => 1 - (1 - k) ** 3;
const clamp = (n: number, a: number, b: number) => Math.min(Math.max(n, a), b);

const BASE = {
  rifle: { x: 0.13, y: -0.17, z: -0.24, rx: 0, ry: 0.08, rz: 0 },
  knife: { x: 0.17, y: -0.14, z: -0.34, rx: 0.12, ry: 0.28, rz: -0.18 },
};

export function Viewmodel({ runtime }: { runtime: RefObject<PlayRuntime> }) {
  const scene = useMemo(() => new THREE.Scene(), []);
  const camera = useMemo(() => new THREE.PerspectiveCamera(62, 1, 0.01, 10), []);
  const size = useThree((s) => s.size);
  const rifleRig = useRef<THREE.Group>(null);
  const knifeRig = useRef<THREE.Group>(null);
  const flash = useRef<THREE.Group>(null);
  const anim = useRef({ phase: 0, swayX: 0, swayY: 0 });
  const reduced = useMemo(() => window.matchMedia('(prefers-reduced-motion: reduce)').matches, []);

  useEffect(() => {
    camera.aspect = size.width / size.height;
    camera.updateProjectionMatrix();
  }, [camera, size]);

  // Priority 1: runs after the world's frame callbacks and takes over rendering for both scenes.
  useFrame(({ gl, scene: world, camera: eye }, delta) => {
    const rt = runtime.current;
    const now = performance.now();
    const a = anim.current;

    // walking bob and mouse sway
    const moving = Math.min(1, rt.speed / 5.2);
    if (!reduced) {
      a.phase += rt.speed * delta * 1.9;
      a.swayX += (clamp(-rt.lookX * 0.0003, -0.035, 0.035) - a.swayX) * 0.15;
      a.swayY += (clamp(rt.lookY * 0.0003, -0.025, 0.025) - a.swayY) * 0.15;
    }
    rt.lookX = 0;
    rt.lookY = 0;
    const amp = reduced ? 0 : moving * (rt.player.grounded ? 0.011 : 0.003);
    const bobX = Math.sin(a.phase) * amp;
    const bobY = -Math.abs(Math.cos(a.phase)) * amp * 1.2;
    const sinceLand = (now - rt.landedAt) / 1000;
    const land = reduced || sinceLand > 0.6 ? 0 : Math.exp(-sinceLand / 0.1) * 0.03;
    const draw = easeOut(clamp((now - rt.switchedAt) / 350, 0, 1));

    const rifle = rifleRig.current;
    const knife = knifeRig.current;
    if (rifle && knife) {
      rifle.visible = rt.weapon === 'rifle';
      knife.visible = rt.weapon === 'knife';
      const rig = rt.weapon === 'rifle' ? rifle : knife;
      const base = BASE[rt.weapon];
      let x = base.x + bobX + a.swayX;
      let y = base.y + bobY + a.swayY - land - (1 - draw) * 0.25;
      let z = base.z;
      let rx = base.rx + (1 - draw) * 0.6;
      let ry = base.ry;
      let rz = base.rz;

      const sinceFire = (now - rt.firedAt) / 1000;
      if (rt.weapon === 'rifle') {
        // the model's own fire clip does the bolt; add a little kick on top
        const kick = sinceFire >= 0 && sinceFire < 0.4 ? Math.exp(-sinceFire / 0.045) : 0;
        z += 0.02 * kick;
        rx += 0.04 * kick;
        if (flash.current) {
          flash.current.visible = sinceFire >= 0 && sinceFire < 0.04;
          flash.current.rotation.z = Math.random() * Math.PI;
        }
        if (now < rt.reloadUntil) {
          const p = 1 - (rt.reloadUntil - now) / RIFLE.reloadTime;
          const dip = Math.sin(clamp(p, 0, 1) * Math.PI);
          y -= 0.1 * dip;
          rz += 0.5 * dip;
          rx -= 0.2 * dip;
        }
      } else {
        const s = (now - rt.firedAt) / KNIFE.swingDelay;
        if (s >= 0 && s < 1) {
          const arc = Math.sin(s * Math.PI);
          x -= 0.12 * arc;
          y += 0.03 * arc;
          ry += 0.9 * arc;
          rz -= 0.7 * arc;
        }
      }
      rig.position.set(x, y, z);
      rig.rotation.set(rx, ry, rz);
    }

    gl.autoClear = true;
    gl.render(world, eye);
    gl.autoClear = false;
    gl.clearDepth();
    gl.render(scene, camera);
  }, 1);

  return createPortal(
    <>
      <hemisphereLight args={['#ffe6bd', '#5a4a30', 1.8]} />
      <directionalLight position={[-1, 2, 2]} intensity={2.4} color="#fff0d6" />
      <directionalLight position={[2, 1, -1]} intensity={0.8} color="#ffd9a0" />
      <group ref={rifleRig}>
        <Suspense fallback={null}>
          <Rifle runtime={runtime} flash={flash} />
        </Suspense>
      </group>
      <group ref={knifeRig} visible={false}>
        <Knife />
      </group>
    </>,
    scene,
  );
}
