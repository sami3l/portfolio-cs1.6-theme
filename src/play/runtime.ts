import { SPAWN } from './map';
import { createPlayer, type Player } from './physics';

export type WeaponId = 'rifle' | 'knife';

/** Full-auto while the trigger is held (600 rounds a minute, like the AK in CS). */
export const RIFLE = { magazine: 30, reserve: 90, fireDelay: 100, reloadTime: 2400 };
export const KNIFE = { swingDelay: 420 };

/**
 * Mutable per-frame state shared by input listeners, the render loop, the viewmodel and the
 * radar. Kept out of React so 60 fps updates never re-render; the HUD gets the few values it
 * shows through state.
 */
export interface PlayRuntime {
  active: boolean;
  keys: Set<string>;
  jumpQueued: boolean;
  yaw: number;
  pitch: number;
  /** Mouse movement since the last frame, for weapon sway. */
  lookX: number;
  lookY: number;
  player: Player;
  /** Horizontal speed in m/s. */
  speed: number;
  /** performance.now() timestamps driving the viewmodel animations. */
  landedAt: number;
  firedAt: number;
  switchedAt: number;
  reloadUntil: number;
  weapon: WeaponId;
  triggerHeld: boolean;
  ammo: number;
  reserve: number;
}

export const createRuntime = (): PlayRuntime => ({
  active: false,
  keys: new Set(),
  jumpQueued: false,
  yaw: SPAWN.yaw,
  pitch: 0,
  lookX: 0,
  lookY: 0,
  player: createPlayer(SPAWN.x, SPAWN.z),
  speed: 0,
  landedAt: -1e9,
  firedAt: -1e9,
  switchedAt: 0,
  reloadUntil: 0,
  weapon: 'rifle',
  triggerHeld: false,
  ammo: RIFLE.magazine,
  reserve: RIFLE.reserve,
});
