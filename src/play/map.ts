import { portfolio } from '../data/portfolio';
import type { WindowId } from '../state/context';
import type { Box } from './physics';

// de_career: the portfolio as a map. Every section is a place:
//   T spawn courtyard  → MOTD board (About), buy zone (Skills), radio (Contact), CV pickups
//   main street        → one building per project, door + sign, E to connect
//   bombsites A and B  → the two headline projects (A carries the architecture overview)
//   north wall         → the scoreboard (Experience)
// Everything solid is an axis-aligned box, so one list drives both rendering and collisions.

export type SolidKind = 'wall' | 'building' | 'crate' | 'ledge' | 'site' | 'board' | 'radio';

export interface Solid {
  /** Centre of the box. */
  center: [number, number, number];
  size: [number, number, number];
  kind: SolidKind;
}

export type PlaceAction =
  | { kind: 'window'; window: WindowId }
  | { kind: 'project'; projectId: string }
  | { kind: 'cv'; lang: string };

/** A spot where something happens: a prompt + E, or (for CV pickups) just walking into it. */
export interface Place {
  id: string;
  /** Text after "Press E to …". Pickups have none. */
  prompt?: string;
  x: number;
  z: number;
  radius: number;
  action: PlaceAction;
}

/** What a flat sign shows; textures are drawn from these in signs.ts. */
export type SignContent =
  | { type: 'plate'; title: string; subtitle?: string }
  | { type: 'motd' }
  | { type: 'scoreboard' }
  | { type: 'overview'; projectId: string }
  | { type: 'letter'; letter: string }
  | { type: 'door' };

export interface Sign {
  content: SignContent;
  position: [number, number, number];
  /** Rotation around Y; 0 faces +z (toward spawn). */
  rotationY: number;
  size: [number, number];
  /** Lie flat on the ground (bombsite letters). */
  flat?: boolean;
}

/** Half the arena's width; the perimeter walls sit just outside it. */
export const ARENA = 32;

/** Where the player appears, facing up the street (yaw 0 looks toward −z). */
export const SPAWN = { x: 0, z: 26, yaw: 0 };

/** B opens the buy menu only in here, like in the game. */
export const BUY_ZONE = { minX: -15, maxX: 15, minZ: 18, maxZ: 31.5 };

/** A box standing on the ground (or on `y0`), given by its footprint centre and size. */
const box = (x: number, z: number, w: number, h: number, d: number, kind: SolidKind, y0 = 0): Solid => ({
  center: [x, y0 + h / 2, z],
  size: [w, h, d],
  kind,
});

const CRATE = 1.2;
const SITE_A = 'gitops-platform';
const SITE_B = 'stratospend';
const projectName = (id: string) => portfolio.projects.find((p) => p.id === id)?.name ?? id;
const mapLabel = (id: string) => {
  const p = portfolio.projects.find((x) => x.id === id);
  return p ? `de_${(p.stack[0] ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '')}` : '';
};

// ---------------------------------------------------------------- layout

const solids: Solid[] = [
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

  // spawn: MOTD board, radio tower, a crate stack and a low ledge
  box(-3, 21, 3, 2.6, 0.2, 'board'),
  box(14, 27, 0.5, 7, 0.5, 'wall'),
  box(13.1, 27, 1.2, 1.4, 0.8, 'radio'),
  box(5, 23, CRATE, CRATE, CRATE, 'crate'),
  box(6.3, 23.3, CRATE, CRATE, CRATE, 'crate'),
  box(5.6, 23.1, CRATE, CRATE, CRATE, 'crate', CRATE),
  box(-9, 27, 3, 0.3, 2, 'ledge'),

  // street cover and a platform you need to jump onto
  box(2.5, 6, CRATE, CRATE, CRATE, 'crate'),
  box(-2, -6, CRATE, CRATE, CRATE, 'crate'),
  box(-2, -7.3, CRATE, CRATE, CRATE, 'crate'),
  box(3, -14, CRATE, CRATE, CRATE, 'crate'),
  box(-6, -2, 4, 0.8, 4, 'ledge'),

  // bombsites: pads in front of their buildings, scoreboard wall between them
  box(-22, -22, 10, 0.3, 8, 'site'),
  box(22, -22, 10, 0.3, 8, 'site'),
  box(-22, -29, 9, 5, 3, 'building'),
  box(22, -29, 9, 5, 3, 'building'),
  box(0, -30, 11, 4.5, 0.6, 'wall'),
];

const places: Place[] = [
  { id: 'motd', prompt: 'read the message of the day', x: -3, z: 22.6, radius: 2, action: { kind: 'window', window: 'about' } },
  { id: 'radio', prompt: 'use the radio (contact)', x: 11.8, z: 27, radius: 2, action: { kind: 'window', window: 'options' } },
  { id: 'scoreboard', prompt: 'check the scoreboard (experience)', x: 0, z: -27, radius: 3, action: { kind: 'window', window: 'scoreboard' } },
  { id: 'site-a', prompt: `connect to ${projectName(SITE_A)}`, x: -22, z: -23.5, radius: 3.2, action: { kind: 'project', projectId: SITE_A } },
  { id: 'site-b', prompt: `connect to ${projectName(SITE_B)}`, x: 22, z: -23.5, radius: 3.2, action: { kind: 'project', projectId: SITE_B } },
];

const signs: Sign[] = [
  { content: { type: 'motd' }, position: [-3, 1.45, 21.11], rotationY: 0, size: [2.8, 2.1] },
  { content: { type: 'plate', title: 'RADIO', subtitle: 'contact' }, position: [12.48, 1.05, 27], rotationY: -Math.PI / 2, size: [0.75, 0.45] },
  { content: { type: 'scoreboard' }, position: [0, 2.35, -29.69], rotationY: 0, size: [10.4, 3.9] },
  // site A: architecture overview, door and sign
  { content: { type: 'overview', projectId: SITE_A }, position: [-23.8, 2.5, -27.49], rotationY: 0, size: [5, 3.2] },
  { content: { type: 'door' }, position: [-19, 1.2, -27.49], rotationY: 0, size: [1.4, 2.4] },
  { content: { type: 'plate', title: projectName(SITE_A), subtitle: mapLabel(SITE_A) }, position: [-19, 3.2, -27.49], rotationY: 0, size: [2.6, 0.75] },
  { content: { type: 'letter', letter: 'A' }, position: [-22, 0.31, -21], rotationY: 0, size: [3.2, 3.2], flat: true },
  // site B
  { content: { type: 'door' }, position: [22, 1.2, -27.49], rotationY: 0, size: [1.4, 2.4] },
  { content: { type: 'plate', title: projectName(SITE_B), subtitle: mapLabel(SITE_B) }, position: [22, 3.4, -27.49], rotationY: 0, size: [4, 1.1] },
  { content: { type: 'letter', letter: 'B' }, position: [22, 0.31, -21], rotationY: 0, size: [3.2, 3.2], flat: true },
];

// main street: the remaining projects get a building each, alternating left/right
const streetProjects = portfolio.projects.filter((p) => p.id !== SITE_A && p.id !== SITE_B);
const SLOTS = [11, 1, -9, -19].flatMap((z) => [
  { side: -1, z },
  { side: 1, z },
]);
SLOTS.forEach(({ side, z }, i) => {
  solids.push(box(12 * side, z, 7, 5, 7, 'building'));
  const project = streetProjects[i];
  if (!project) return;
  const face = 8.5 * side - 0.01 * side; // street-facing wall, nudged out to avoid z-fighting
  const rotationY = side < 0 ? Math.PI / 2 : -Math.PI / 2;
  signs.push(
    { content: { type: 'door' }, position: [face, 1.2, z], rotationY, size: [1.4, 2.4] },
    { content: { type: 'plate', title: project.name, subtitle: mapLabel(project.id) }, position: [face, 3.25, z], rotationY, size: [3.2, 0.9] },
  );
  places.push({
    id: `project-${project.id}`,
    prompt: `connect to ${project.name}`,
    x: 7.1 * side,
    z,
    radius: 2.1,
    action: { kind: 'project', projectId: project.id },
  });
});

// CV pickups: walk into one to download that language
export const PICKUPS = portfolio.contact.resumes.map((r, i) => ({ lang: r.lang, label: r.label, x: -13, z: 25 + i * 2.6 }));
for (const p of PICKUPS) places.push({ id: `cv-${p.lang}`, x: p.x, z: p.z, radius: 0.9, action: { kind: 'cv', lang: p.lang } });

export const SOLIDS = solids;
export const PLACES = places;
export const SIGNS = signs;

export const BOXES: Box[] = SOLIDS.map(({ center: [x, y, z], size: [w, h, d] }) => ({
  min: [x - w / 2, y - h / 2, z - d / 2],
  max: [x + w / 2, y + h / 2, z + d / 2],
}));

export const inBuyZone = (x: number, z: number) =>
  x >= BUY_ZONE.minX && x <= BUY_ZONE.maxX && z >= BUY_ZONE.minZ && z <= BUY_ZONE.maxZ;

/** The place the player is standing at, if any (closest wins). */
export function placeAt(x: number, z: number) {
  let best: Place | null = null;
  let bestD = Infinity;
  for (const p of PLACES) {
    const d = Math.hypot(p.x - x, p.z - z);
    if (d <= p.radius && d < bestD) {
      best = p;
      bestD = d;
    }
  }
  return best;
}
