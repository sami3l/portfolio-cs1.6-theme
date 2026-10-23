// Hand-rolled first-person movement: a vertical capsule (circle in XZ + height) against
// axis-aligned boxes. No physics engine; just enough for a CS feel: run, walk, jump onto
// crates, step up small ledges, slide along walls. Units are metres and seconds.

export interface Box {
  min: [number, number, number];
  max: [number, number, number];
}

export interface Player {
  x: number;
  y: number; // feet
  z: number;
  vx: number;
  vy: number;
  vz: number;
  grounded: boolean;
}

export interface Input {
  /** -1 back … 1 forward */
  forward: number;
  /** -1 left … 1 right */
  right: number;
  /** Camera heading in radians (Three.js rotation.y). */
  yaw: number;
  walk: boolean;
  jump: boolean;
}

export const PLAYER = {
  radius: 0.35,
  height: 1.75,
  eye: 1.62,
  runSpeed: 5.2,
  walkSpeed: 2.3,
  /** How quickly velocity reaches the target, per second (ground / air). */
  groundResponse: 12,
  airResponse: 2,
  gravity: 20,
  /** Clears a 1.2 m crate: v² / 2g ≈ 1.23 m. */
  jumpSpeed: 7,
  /** Ledges up to this height are walked onto without jumping. */
  stepHeight: 0.4,
};

export const createPlayer = (x: number, z: number): Player => ({ x, y: 0, z, vx: 0, vy: 0, vz: 0, grounded: true });

/** Boxes that overlap the player's body vertically (ignoring anything low enough to step onto). */
const blocksBody = (p: Player, b: Box) => b.max[1] > p.y + PLAYER.stepHeight && b.min[1] < p.y + PLAYER.height;

/** Push the player's circle out of a box in XZ and cancel velocity into the wall. */
function pushOut(p: Player, b: Box) {
  const r = PLAYER.radius;
  const cx = Math.min(Math.max(p.x, b.min[0]), b.max[0]);
  const cz = Math.min(Math.max(p.z, b.min[2]), b.max[2]);
  let nx = p.x - cx;
  let nz = p.z - cz;
  const d2 = nx * nx + nz * nz;
  if (d2 >= r * r) return;

  let depth: number;
  if (d2 > 1e-10) {
    const d = Math.sqrt(d2);
    nx /= d;
    nz /= d;
    depth = r - d;
  } else {
    // Centre is inside the box: leave by the nearest face.
    const exits = [
      { n: [-1, 0], d: p.x - b.min[0] + r },
      { n: [1, 0], d: b.max[0] - p.x + r },
      { n: [0, -1], d: p.z - b.min[2] + r },
      { n: [0, 1], d: b.max[2] - p.z + r },
    ].sort((a, c) => a.d - c.d)[0];
    [nx, nz] = exits.n;
    depth = exits.d;
  }
  p.x += nx * depth;
  p.z += nz * depth;
  const into = p.vx * nx + p.vz * nz;
  if (into < 0) {
    p.vx -= into * nx;
    p.vz -= into * nz;
  }
}

/** Does the player's circle overlap the box's footprint (slightly shrunk so edges don't catch)? */
function overFootprint(p: Player, b: Box, shrink = 0.05) {
  const r = PLAYER.radius - shrink;
  const cx = Math.min(Math.max(p.x, b.min[0]), b.max[0]);
  const cz = Math.min(Math.max(p.z, b.min[2]), b.max[2]);
  return (p.x - cx) ** 2 + (p.z - cz) ** 2 < r * r;
}

export function step(p: Player, input: Input, boxes: Box[], dt: number) {
  // Desired horizontal velocity from the keys, relative to where the camera faces.
  const sin = Math.sin(input.yaw);
  const cos = Math.cos(input.yaw);
  let wx = -sin * input.forward + cos * input.right;
  let wz = -cos * input.forward - sin * input.right;
  const len = Math.hypot(wx, wz);
  if (len > 1) {
    wx /= len;
    wz /= len;
  }
  const speed = input.walk ? PLAYER.walkSpeed : PLAYER.runSpeed;
  const k = Math.min(1, (p.grounded ? PLAYER.groundResponse : PLAYER.airResponse) * dt);
  p.vx += (wx * speed - p.vx) * k;
  p.vz += (wz * speed - p.vz) * k;

  if (input.jump && p.grounded) {
    p.vy = PLAYER.jumpSpeed;
    p.grounded = false;
  }
  p.vy -= PLAYER.gravity * dt;

  // Horizontal move, then resolve walls (two passes handle corners).
  p.x += p.vx * dt;
  p.z += p.vz * dt;
  for (let pass = 0; pass < 2; pass++) {
    for (const b of boxes) if (blocksBody(p, b)) pushOut(p, b);
  }

  // Vertical move against floors (ground, crate tops) and ceilings.
  const prevY = p.y;
  let floor = 0;
  for (const b of boxes) {
    if (b.max[1] <= prevY + PLAYER.stepHeight + 1e-3 && b.max[1] > floor && overFootprint(p, b)) floor = b.max[1];
  }
  let y = prevY + p.vy * dt;
  for (const b of boxes) {
    const headBefore = prevY + PLAYER.height;
    if (b.min[1] >= headBefore - 1e-3 && y + PLAYER.height > b.min[1] && overFootprint(p, b)) {
      y = b.min[1] - PLAYER.height;
      p.vy = Math.min(p.vy, 0);
    }
  }

  const wasGrounded = p.grounded;
  if (p.vy <= 0 && (y <= floor || (wasGrounded && y - floor <= PLAYER.stepHeight))) {
    // Land, step up onto a low ledge, or stick to the ground when walking down one.
    y = floor;
    p.vy = 0;
    p.grounded = true;
  } else {
    p.grounded = false;
  }
  p.y = y;
}
