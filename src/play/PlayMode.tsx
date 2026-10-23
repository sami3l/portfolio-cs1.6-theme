import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState, type RefObject } from 'react';
import * as THREE from 'three';
import { trackEvent } from '../analytics';
import { sfx } from '../audio/sfx';
import { canvasTexture, crateTexture, HORIZON, mulberry32, SAND, TRIM, WALL } from '../components/scene/materials';
import { Sky } from '../components/scene/Sky';
import { Button } from '../components/vgui/Button';
import { portfolio } from '../data/portfolio';
import { useStore } from '../state/context';
import { downloadFile } from '../utils/download';
import { asset } from '../utils/format';
import { Hud } from './Hud';
import { areaAt, BOXES, inBuyZone, placeAt, SOLIDS, SPAWN, type Place, type SolidKind } from './map';
import { PLAYER, step } from './physics';
import { Places } from './Places';
import { Radar } from './Radar';
import { createRuntime, KNIFE, RIFLE, type PlayRuntime, type WeaponId } from './runtime';
import { Viewmodel } from './Viewmodel';

/** Where the player stands, reported by the render loop only when it changes. */
interface Status {
  place: Place | null;
  buyZone: boolean;
  area: string;
}

interface HudState {
  weapon: WeaponId;
  ammo: number;
  reserve: number;
  reloading: boolean;
}

const SENSITIVITY = 0.0022;
const MAX_PITCH = Math.PI / 2 - 0.01;
/** Metres between footstep sounds while running (walking with Shift is silent, as in CS). */
const STRIDE = 2.1;

const COLORS: Record<Exclude<SolidKind, 'crate'>, string> = {
  wall: WALL,
  building: '#d4ab72',
  ledge: TRIM,
  site: '#b98a52',
  board: '#6e4a28',
  radio: '#4c5844',
};

/** Fine sand speckle so you can feel yourself moving over the ground. */
const sandTexture = () => {
  const texture = canvasTexture(256, 256, (g) => {
    const rng = mulberry32(11);
    g.fillStyle = SAND;
    g.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 2200; i++) {
      g.fillStyle = rng() < 0.5 ? 'rgba(120, 84, 40, 0.18)' : 'rgba(255, 240, 210, 0.22)';
      g.fillRect(rng() * 256, rng() * 256, 1 + rng() * 2, 1 + rng() * 2);
    }
    g.strokeStyle = 'rgba(120, 84, 40, 0.12)';
    g.strokeRect(0, 0, 256, 256);
  });
  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(50, 50);
  return texture;
};

function World() {
  const crate = useMemo(crateTexture, []);
  const sand = useMemo(sandTexture, []);
  return (
    <>
      <mesh rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial map={sand} roughness={1} />
      </mesh>
      {SOLIDS.map((s, i) => (
        <mesh key={i} position={s.center} castShadow receiveShadow>
          <boxGeometry args={s.size} />
          {s.kind === 'crate' ? (
            <meshStandardMaterial map={crate} roughness={0.85} />
          ) : (
            <meshStandardMaterial color={s.kind === 'building' && i % 2 ? '#c99e66' : COLORS[s.kind]} roughness={0.95} />
          )}
        </mesh>
      ))}
      <Places />
    </>
  );
}

const NO_KEYS = new Set<string>();
const keyDown = (keys: Set<string>, ...codes: string[]) => (codes.some((c) => keys.has(c)) ? 1 : 0);

function PlayerController({ runtime, onStatus }: { runtime: RefObject<PlayRuntime>; onStatus: (s: Status) => void }) {
  const camera = useThree((s) => s.camera);
  const last = useRef<Status>({ place: null, buyZone: true, area: 'T Spawn' });
  const stride = useRef({ distance: 0, left: false });

  useEffect(() => {
    // Dev-only: lets the browser tests drive and teleport the player; stripped from builds.
    if (import.meta.env.DEV) Object.assign(window, { __playControls: runtime.current, __playPlayer: runtime.current.player });
  }, [runtime]);

  useFrame((_, delta) => {
    const rt = runtime.current;
    const keys = rt.active ? rt.keys : NO_KEYS;
    const input = {
      forward: keyDown(keys, 'KeyW', 'ArrowUp') - keyDown(keys, 'KeyS', 'ArrowDown'),
      right: keyDown(keys, 'KeyD', 'ArrowRight') - keyDown(keys, 'KeyA', 'ArrowLeft'),
      yaw: rt.yaw,
      walk: keyDown(keys, 'ShiftLeft', 'ShiftRight') === 1,
      jump: rt.active && rt.jumpQueued,
    };
    rt.jumpQueued = false;

    const p = rt.player;
    const wasGrounded = p.grounded;
    let fallSpeed = 0;
    // Small substeps keep collisions stable when a frame takes long.
    const dt = Math.min(delta, 0.05);
    const steps = dt > 1 / 60 ? 2 : 1;
    for (let i = 0; i < steps; i++) {
      const vyBefore = p.vy;
      const airborne = !p.grounded;
      step(p, { ...input, jump: input.jump && i === 0 }, BOXES, dt / steps);
      if (airborne && p.grounded) fallSpeed = Math.min(fallSpeed, vyBefore);
    }

    rt.speed = Math.hypot(p.vx, p.vz);
    if (!wasGrounded && p.grounded && fallSpeed < -5) {
      rt.landedAt = performance.now();
      sfx.land();
    }
    if (p.grounded && !input.walk && rt.speed > 1.5) {
      stride.current.distance += rt.speed * dt;
      if (stride.current.distance > STRIDE) {
        stride.current.distance = 0;
        stride.current.left = !stride.current.left;
        sfx.footstep(stride.current.left);
      }
    }

    camera.position.set(p.x, p.y + PLAYER.eye, p.z);
    camera.rotation.set(rt.pitch, rt.yaw, 0, 'YXZ');

    const status = { place: placeAt(p.x, p.z), buyZone: inBuyZone(p.x, p.z), area: areaAt(p.x, p.z) };
    const prev = last.current;
    if (status.place !== prev.place || status.buyZone !== prev.buyZone || status.area !== prev.area) {
      last.current = status;
      onStatus(status);
    }
  });
  return null;
}

/**
 * de_career: the portfolio as a walkable map. Desktop only (App shows a message elsewhere).
 * Clicking captures the mouse (pointer lock); Esc releases it and pauses. E uses the place
 * you stand at, B buys in the buy zone; both open the normal windows over the paused game.
 */
export default function PlayMode() {
  const { state, actions } = useStore();
  const [locked, setLocked] = useState(false);
  const [started, setStarted] = useState(false);
  const [lockError, setLockError] = useState(false);
  const [status, setStatus] = useState<Status>({ place: null, buyZone: true, area: 'T Spawn' });
  const [flash, setFlash] = useState('');
  const runtime = useRef<PlayRuntime>(createRuntime());
  const [hud, setHud] = useState<HudState>({ weapon: 'rifle', ammo: RIFLE.magazine, reserve: RIFLE.reserve, reloading: false });
  const statusRef = useRef(status);
  const playerName = useRef(state.settings.playerName);
  // Windows and the connecting screen sit on top of the game; the pause menu waits behind them.
  const windowOpen = state.stack.length > 0 || state.connecting !== null;
  const windowOpenRef = useRef(windowOpen);

  useEffect(() => {
    playerName.current = state.settings.playerName;
    windowOpenRef.current = windowOpen;
  }, [state.settings.playerName, windowOpen]);

  const lock = () => {
    setLockError(false);
    // Chrome returns a promise and refuses a re-lock for about a second after Esc.
    Promise.resolve(document.body.requestPointerLock()).catch(() => setLockError(true));
  };

  const onStatus = (s: Status) => {
    const enteredPickup = s.place !== statusRef.current.place && s.place?.action.kind === 'cv';
    statusRef.current = s;
    setStatus(s);
    // Walking into a CV pickup downloads it straight away; leaving and re-entering repeats it.
    if (enteredPickup && s.place?.action.kind === 'cv') {
      const lang = s.place.action.lang;
      const file = portfolio.contact.resumes.find((r) => r.lang === lang);
      if (!file) return;
      sfx.buy();
      downloadFile(asset(file.href), file.filename);
      trackEvent(`play: pickup cv ${lang}`);
      actions.kill({ killer: playerName.current, weapon: 'sniper', victim: `CV_${lang}.pdf`, headshot: true });
    }
  };

  // E / B: release the mouse and open the matching window over the game.
  const interact = (place: Place) => {
    document.exitPointerLock();
    trackEvent(`play: ${place.id}`);
    if (place.action.kind === 'window') actions.open(place.action.window);
    else if (place.action.kind === 'project') actions.connect(place.action.projectId);
  };

  useEffect(() => {
    const rt = runtime.current;
    let flashTimer = 0;
    let reloadTimer = 0;
    const showFlash = (text: string) => {
      setFlash(text);
      clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => setFlash(''), 1800);
    };
    const syncHud = () =>
      setHud({ weapon: rt.weapon, ammo: rt.ammo, reserve: rt.reserve, reloading: performance.now() < rt.reloadUntil });

    const switchTo = (weapon: WeaponId) => {
      if (weapon === rt.weapon) return;
      rt.weapon = weapon;
      rt.switchedAt = performance.now();
      rt.reloadUntil = 0;
      clearTimeout(reloadTimer);
      sfx.draw();
      syncHud();
    };
    const reload = () => {
      const now = performance.now();
      if (rt.weapon !== 'rifle' || rt.ammo >= RIFLE.magazine || rt.reserve === 0 || now < rt.reloadUntil) return;
      rt.reloadUntil = now + RIFLE.reloadTime;
      sfx.reload();
      syncHud();
      reloadTimer = window.setTimeout(() => {
        if (rt.weapon !== 'rifle' || rt.reloadUntil === 0) return;
        const take = Math.min(RIFLE.magazine - rt.ammo, rt.reserve);
        rt.ammo += take;
        rt.reserve -= take;
        rt.reloadUntil = 0;
        syncHud();
      }, RIFLE.reloadTime);
    };
    const fire = () => {
      const now = performance.now();
      if (now - rt.switchedAt < 350) return;
      if (rt.weapon === 'knife') {
        if (now - rt.firedAt < KNIFE.swingDelay) return;
        rt.firedAt = now;
        sfx.knife();
        return;
      }
      // A little tolerance so the auto-fire timer (which can fire a millisecond early) isn't rejected.
      if (now < rt.reloadUntil || now - rt.firedAt < RIFLE.fireDelay - 20) return;
      if (rt.ammo === 0) {
        sfx.empty();
        reload();
        return;
      }
      rt.ammo -= 1;
      rt.firedAt = now;
      sfx.rifle();
      syncHud();
    };

    const onLockChange = () => {
      const isLocked = document.pointerLockElement === document.body;
      rt.active = isLocked;
      rt.triggerHeld = false;
      rt.keys.clear();
      setLocked(isLocked);
      if (isLocked) {
        setStarted(true);
        rt.switchedAt = performance.now(); // draw the weapon each time you come back
        sfx.draw();
      }
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!rt.active) return;
      rt.yaw -= e.movementX * SENSITIVITY;
      rt.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, rt.pitch - e.movementY * SENSITIVITY));
      rt.lookX += e.movementX;
      rt.lookY += e.movementY;
    };
    // Holding the button keeps firing; fire() itself enforces the rate of fire.
    let autoTimer = 0;
    const onMouseDown = (e: MouseEvent) => {
      if (!rt.active || windowOpenRef.current || e.button !== 0) return;
      rt.triggerHeld = true;
      fire();
      clearInterval(autoTimer);
      autoTimer = window.setInterval(() => {
        if (!rt.triggerHeld || !rt.active || rt.weapon !== 'rifle') return clearInterval(autoTimer);
        fire();
      }, RIFLE.fireDelay);
    };
    const onMouseUp = (e: MouseEvent) => {
      if (e.button === 0) rt.triggerHeld = false;
    };
    const onWheel = (e: WheelEvent) => {
      if (rt.active && Math.abs(e.deltaY) > 0) switchTo(rt.weapon === 'rifle' ? 'knife' : 'rifle');
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!rt.active) return;
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (!e.repeat) {
        if (e.code === 'Space') rt.jumpQueued = true;
        if (e.code === 'KeyE') {
          const place = statusRef.current.place;
          if (place?.prompt) interact(place);
        }
        if (e.code === 'KeyB') {
          if (statusRef.current.buyZone) interact({ id: 'buy-zone', x: 0, z: 0, radius: 0, action: { kind: 'window', window: 'skills' } });
          else showFlash('You are not in a buy zone.');
        }
        if (e.code === 'Digit1') switchTo('rifle');
        if (e.code === 'Digit3') switchTo('knife');
        if (e.code === 'KeyQ') switchTo(rt.weapon === 'rifle' ? 'knife' : 'rifle');
        if (e.code === 'KeyR') reload();
      }
      rt.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => rt.keys.delete(e.code);
    const onBlur = () => rt.keys.clear();

    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('wheel', onWheel, { passive: true });
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      clearTimeout(flashTimer);
      clearTimeout(reloadTimer);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mousedown', onMouseDown);
      document.removeEventListener('mouseup', onMouseUp);
      clearInterval(autoTimer);
      document.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', onBlur);
      if (document.pointerLockElement) document.exitPointerLock();
    };
    // `interact` only reads stable store actions.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const greeted = useRef(false);
  useEffect(() => {
    if (!started || greeted.current) return;
    greeted.current = true;
    trackEvent('play: start');
    actions.kill({ killer: state.settings.playerName, weapon: 'knife', victim: 'the main menu' });
  }, [started, actions, state.settings.playerName]);

  return (
    <div className="play">
      <Canvas
        className="play__canvas"
        shadows
        dpr={[1, 1.5]}
        camera={{ fov: 74, near: 0.05, far: 250, position: [SPAWN.x, PLAYER.eye, SPAWN.z] }}
        gl={{ antialias: true, powerPreference: 'high-performance', toneMappingExposure: 1.2 }}
      >
        <fog attach="fog" args={[HORIZON, 35, 120]} />
        <hemisphereLight args={['#ffe6bd', '#8a6a42', 1]} />
        <directionalLight
          position={[20, 30, 15]}
          intensity={2.8}
          color="#fff0d6"
          castShadow
          shadow-mapSize={[2048, 2048]}
          shadow-camera-left={-40}
          shadow-camera-right={40}
          shadow-camera-top={40}
          shadow-camera-bottom={-40}
          shadow-camera-far={100}
          shadow-bias={-0.0005}
        />
        <Sky />
        <World />
        <PlayerController runtime={runtime} onStatus={onStatus} />
        <Viewmodel runtime={runtime} />
      </Canvas>

      {locked && (
        <>
          <div className="play__crosshair" aria-hidden="true" />
          <div className="play__radar-wrap">
            <Radar runtime={runtime} />
            <p className="play__area">{status.area}</p>
          </div>
          {status.place?.prompt && (
            <p className="play__prompt" role="status">
              Press <kbd>E</kbd> to {status.place.prompt}
            </p>
          )}
          {flash && <p className="play__flash">{flash}</p>}
          {status.buyZone && (
            <p className="play__buyzone">
              <span aria-hidden="true">$</span> Buy zone · <kbd>B</kbd> skills
            </p>
          )}
          <Hud {...hud} />
          <p className="play__hint">
            <kbd>E</kbd> use · <kbd>LMB</kbd> fire · <kbd>R</kbd> reload · <kbd>Q</kbd> switch · <kbd>TAB</kbd> scoreboard · <kbd>Esc</kbd> pause
          </p>
        </>
      )}

      {!locked && !windowOpen && (
        <div className="play__overlay">
          <section className="vgui-window is-focused play__dialog" aria-labelledby="play-title">
            <header className="vgui-titlebar">
              <h2 id="play-title" className="vgui-titlebar__title">
                {started ? 'Paused' : 'de_career'}
              </h2>
            </header>
            <div className="vgui-body">
              {!started && (
                <p>
                  Walk around the portfolio. Projects are buildings and bombsites, the scoreboard is on the far wall, and the
                  radio at spawn gets you in touch. Grab a glowing crate for my CV.
                </p>
              )}
              <dl className="play__controls">
                <dt>Move</dt>
                <dd>W A S D (or the arrow keys)</dd>
                <dt>Look</dt>
                <dd>Mouse</dd>
                <dt>Walk slowly</dt>
                <dd>Shift (silent)</dd>
                <dt>Jump</dt>
                <dd>Space</dd>
                <dt>Use</dt>
                <dd>E · B in the buy zone</dd>
                <dt>Fire / reload</dt>
                <dd>Left click (hold for full-auto) · R</dd>
                <dt>Weapons</dt>
                <dd>1 rifle · 3 knife · Q or wheel to switch</dd>
                <dt>Scoreboard</dt>
                <dd>Hold TAB</dd>
                <dt>Pause</dt>
                <dd>Esc</dd>
              </dl>
              <p className="hint play__credit">
                Rifle and hands: <a href="https://opengameart.org/content/low-poly-fps-rifle-and-hands" target="_blank" rel="noreferrer">Low poly FPS rifle and hands</a> by Robin Lamb (CC0).
              </p>
              {lockError && (
                <p className="hint">The browser didn't capture the mouse. Click again (right after Esc it needs a second).</p>
              )}
            </div>
            <footer className="vgui-footer">
              <Button onClick={() => actions.setView('game')}>Back to menu</Button>
              <Button autoFocus onClick={lock}>
                {started ? 'Resume' : 'Play'}
              </Button>
            </footer>
          </section>
        </div>
      )}
    </div>
  );
}
