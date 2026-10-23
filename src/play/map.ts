import type { Box } from './physics';

// de_career, milestone 1 greybox: the layout only. Milestone 2 turns the street buildings
// into projects and adds the portfolio places (buy zone, scoreboard wall, radio, CV crate).
// Everything is an axis-aligned box, so the same list drives both rendering and collisions.

export type SolidKind = 'wall' | 'building' | 'crate' | 'ledge' | 'site';

export interface Solid {
  /** Centre of the box. */
  center: [number, number, number];
  size: [number, number, number];
  kind: SolidKind;
}

/** Half the arena's width; the perimeter walls sit just outside it. */
export const ARENA = 32;

/** Where the player appears, facing up the street (yaw 0 looks toward −z). */
export const SPAWN = { x: 0, z: 26, yaw: 0 };

/** A box standing on the ground (or on `y0`), given by its footprint centre and size. */
const box = (x: number, z: number, w: number, h: number, d: number, kind: SolidKind, y0 = 0): Solid => ({
  center: [x, y0 + h / 2, z],
  size: [w, h, d],
  kind,
});

const CRATE = 1.2;

export const SOLIDS: Solid[] = [
  // perimeter
  box(0, -ARENA - 0.5, ARENA * 2 + 2, 6, 1, 'wall'),
  box(0, ARENA + 0.5, ARENA * 2 + 2, 6, 1, 'wall'),
  box(-ARENA - 0.5, 0, 1, 6, ARENA * 2 + 2, 'wall'),
  box(ARENA + 0.5, 0, 1, 6, ARENA * 2 + 2, 'wall'),

  // gate arch between spawn and the street
  box(-3.2, 17, 1.2, 5, 1.2, 'wall'),
  box(3.2, 17, 1.2, 5, 1.2, 'wall'),
  box(0, 17, 7.6, 1, 1.2, 'wall', 4),
  box(-8.5, 17, 9.4, 4, 1, 'wall'),
  box(8.5, 17, 9.4, 4, 1, 'wall'),

  // main street: future project buildings
  ...[11, 1, -9, -19].flatMap((z) => [box(-12, z, 7, 5, 7, 'building'), box(12, z, 7, 5, 7, 'building')]),

  // spawn crates (a 2-high stack to test jumping)
  box(5, 23, CRATE, CRATE, CRATE, 'crate'),
  box(6.3, 23.3, CRATE, CRATE, CRATE, 'crate'),
  box(5.6, 23.1, CRATE, CRATE, CRATE, 'crate', CRATE),

  // a low ledge you can step onto, and a platform you need to jump onto
  box(-5, 22, 3, 0.3, 2, 'ledge'),
  box(-6, -2, 4, 0.8, 4, 'ledge'),

  // street cover
  box(2.5, 6, CRATE, CRATE, CRATE, 'crate'),
  box(-2, -6, CRATE, CRATE, CRATE, 'crate'),
  box(-2, -7.3, CRATE, CRATE, CRATE, 'crate'),
  box(3, -14, CRATE, CRATE, CRATE, 'crate'),

  // bombsite pads at the far end (A left, B right)
  box(-18, -25, 10, 0.3, 8, 'site'),
  box(18, -25, 10, 0.3, 8, 'site'),
];

export const BOXES: Box[] = SOLIDS.map(({ center: [x, y, z], size: [w, h, d] }) => ({
  min: [x - w / 2, y - h / 2, z - d / 2],
  max: [x + w / 2, y + h / 2, z + d / 2],
}));
