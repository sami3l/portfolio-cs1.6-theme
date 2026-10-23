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
import { BOXES, inBuyZone, placeAt, SOLIDS, SPAWN, type Place, type SolidKind } from './map';
import { createPlayer, PLAYER, step } from './physics';
import { Places } from './Places';

/** Input state shared between DOM listeners and the render loop without re-rendering React. */
interface Controls {
  active: boolean;
  keys: Set<string>;
  yaw: number;
  pitch: number;
  jumpQueued: boolean;
}

/** Where the player stands, reported by the render loop only when it changes. */
interface Status {
  place: Place | null;
  buyZone: boolean;
}

const SENSITIVITY = 0.0022;
const MAX_PITCH = Math.PI / 2 - 0.01;

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

const keyDown = (keys: Set<string>, ...codes: string[]) => (codes.some((c) => keys.has(c)) ? 1 : 0);

function PlayerController({ controls, onStatus }: { controls: RefObject<Controls>; onStatus: (s: Status) => void }) {
  const camera = useThree((s) => s.camera);
  const player = useRef(createPlayer(SPAWN.x, SPAWN.z));
  const last = useRef<Status>({ place: null, buyZone: true });

  useEffect(() => {
    // Dev-only: lets the browser tests teleport the player; stripped from builds.
    if (import.meta.env.DEV) Object.assign(window, { __playPlayer: player.current });
  }, []);

  useFrame((_, delta) => {
    const c = controls.current;
    const keys = c.active ? c.keys : new Set<string>();
    const input = {
      forward: keyDown(keys, 'KeyW', 'ArrowUp') - keyDown(keys, 'KeyS', 'ArrowDown'),
      right: keyDown(keys, 'KeyD', 'ArrowRight') - keyDown(keys, 'KeyA', 'ArrowLeft'),
      yaw: c.yaw,
      walk: keyDown(keys, 'ShiftLeft', 'ShiftRight') === 1,
      jump: c.active && c.jumpQueued,
    };
    c.jumpQueued = false;

    // Small substeps keep collisions stable when a frame takes long.
    const dt = Math.min(delta, 0.05);
    const steps = dt > 1 / 60 ? 2 : 1;
    for (let i = 0; i < steps; i++) step(player.current, { ...input, jump: input.jump && i === 0 }, BOXES, dt / steps);

    const p = player.current;
    camera.position.set(p.x, p.y + PLAYER.eye, p.z);
    camera.rotation.set(c.pitch, c.yaw, 0, 'YXZ');

    const status = { place: placeAt(p.x, p.z), buyZone: inBuyZone(p.x, p.z) };
    if (status.place !== last.current.place || status.buyZone !== last.current.buyZone) {
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
  const [status, setStatus] = useState<Status>({ place: null, buyZone: true });
  const [flash, setFlash] = useState('');
  const controls = useRef<Controls>({ active: false, keys: new Set(), yaw: SPAWN.yaw, pitch: 0, jumpQueued: false });
  const statusRef = useRef(status);
  const playerName = useRef(state.settings.playerName);

  useEffect(() => {
    playerName.current = state.settings.playerName;
  }, [state.settings.playerName]);

  const lock = () => {
    setLockError(false);
    // Chrome returns a promise and refuses a re-lock for about a second after Esc.
    Promise.resolve(document.body.requestPointerLock()).catch(() => setLockError(true));
  };

  const onStatus = (s: Status) => {
    statusRef.current = s;
    setStatus(s);
    // Walking into a CV pickup downloads it straight away; leaving and re-entering repeats it.
    if (s.place?.action.kind === 'cv') {
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
    let flashTimer = 0;
    const showFlash = (text: string) => {
      setFlash(text);
      clearTimeout(flashTimer);
      flashTimer = window.setTimeout(() => setFlash(''), 1800);
    };

    const c = controls.current;
    // Dev-only hook so the render loop can be driven without pointer lock; stripped from builds.
    if (import.meta.env.DEV) Object.assign(window, { __playControls: c });
    const onLockChange = () => {
      const isLocked = document.pointerLockElement === document.body;
      c.active = isLocked;
      c.keys.clear();
      setLocked(isLocked);
      if (isLocked) setStarted(true);
    };
    const onMouseMove = (e: MouseEvent) => {
      if (!c.active) return;
      c.yaw -= e.movementX * SENSITIVITY;
      c.pitch = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, c.pitch - e.movementY * SENSITIVITY));
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (!c.active) return;
      if (['Space', 'Tab', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
      if (e.code === 'Space' && !e.repeat) c.jumpQueued = true;
      if (e.code === 'KeyE' && !e.repeat) {
        const place = statusRef.current.place;
        if (place?.prompt) interact(place);
      }
      if (e.code === 'KeyB' && !e.repeat) {
        if (statusRef.current.buyZone) interact({ id: 'buy-zone', x: 0, z: 0, radius: 0, action: { kind: 'window', window: 'skills' } });
        else showFlash('You are not in a buy zone.');
      }
      c.keys.add(e.code);
    };
    const onKeyUp = (e: KeyboardEvent) => c.keys.delete(e.code);
    const onBlur = () => c.keys.clear();

    document.addEventListener('pointerlockchange', onLockChange);
    document.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', onBlur);
    return () => {
      clearTimeout(flashTimer);
      document.removeEventListener('pointerlockchange', onLockChange);
      document.removeEventListener('mousemove', onMouseMove);
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

  // Windows and the connecting screen sit on top of the game; the pause menu waits behind them.
  const windowOpen = state.stack.length > 0 || state.connecting !== null;

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
        <PlayerController controls={controls} onStatus={onStatus} />
      </Canvas>

      {locked && (
        <>
          <div className="play__crosshair" aria-hidden="true" />
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
          <p className="play__hint">
            <kbd>WASD</kbd> move · <kbd>Shift</kbd> walk · <kbd>Space</kbd> jump · <kbd>E</kbd> use · <kbd>TAB</kbd> scoreboard ·{' '}
            <kbd>Esc</kbd> pause
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
                <dd>Shift</dd>
                <dt>Jump</dt>
                <dd>Space</dd>
                <dt>Use</dt>
                <dd>E · B in the buy zone</dd>
                <dt>Scoreboard</dt>
                <dd>Hold TAB</dd>
                <dt>Pause</dt>
                <dd>Esc</dd>
              </dl>
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
