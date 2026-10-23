import { useEffect, useRef, type RefObject } from 'react';
import { PLACES, SOLIDS } from './map';
import type { PlayRuntime } from './runtime';

const SIZE = 180;
/** Pixels per metre: the radar shows about 22 m around the player. */
const SCALE = 4;

const FILL: Partial<Record<string, string>> = {
  wall: 'rgba(205, 185, 140, 0.55)',
  building: 'rgba(205, 185, 140, 0.55)',
  board: 'rgba(205, 185, 140, 0.55)',
  radio: 'rgba(153, 204, 255, 0.7)',
  crate: 'rgba(205, 185, 140, 0.35)',
  ledge: 'rgba(205, 185, 140, 0.25)',
};

/**
 * Top-left radar like the in-game one: rotates so you always face up, draws the map's
 * footprint, and marks bombsites, projects, the radio and the CV crates.
 */
export function Radar({ runtime }: { runtime: RefObject<PlayRuntime> }) {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = canvas.current;
    const g = el?.getContext('2d');
    if (!el || !g) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    el.width = SIZE * dpr;
    el.height = SIZE * dpr;

    let frame = 0;
    const draw = () => {
      frame = requestAnimationFrame(draw);
      const { player: p, yaw } = runtime.current;
      const sin = Math.sin(yaw);
      const cos = Math.cos(yaw);
      // world (x, z) → radar pixels, player at the centre facing up
      const toScreen = (x: number, z: number): [number, number] => {
        const dx = x - p.x;
        const dz = z - p.z;
        return [SIZE / 2 + (dx * cos - dz * sin) * SCALE, SIZE / 2 + (dx * sin + dz * cos) * SCALE];
      };

      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, SIZE, SIZE);
      g.fillStyle = 'rgba(10, 16, 8, 0.6)';
      g.fillRect(0, 0, SIZE, SIZE);
      g.save();
      g.beginPath();
      g.rect(0, 0, SIZE, SIZE);
      g.clip();

      for (const s of SOLIDS) {
        if (s.kind === 'site') continue;
        const [cx, , cz] = s.center;
        const [w, , d] = s.size;
        g.fillStyle = FILL[s.kind] ?? 'rgba(205, 185, 140, 0.5)';
        g.beginPath();
        for (const [ox, oz] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) g.lineTo(...toScreen(cx + (ox * w) / 2, cz + (oz * d) / 2));
        g.fill();
      }

      g.font = 'bold 16px Tahoma, sans-serif';
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      for (const pl of PLACES) {
        const [sx, sy] = toScreen(pl.x, pl.z);
        if (pl.id === 'site-a' || pl.id === 'site-b') {
          g.fillStyle = '#ff5a4a';
          g.fillText(pl.id === 'site-a' ? 'A' : 'B', sx, sy);
        } else {
          g.fillStyle = pl.action.kind === 'cv' ? '#ffa01e' : pl.action.kind === 'project' ? '#c4b550' : '#99ccff';
          g.beginPath();
          g.arc(sx, sy, 3, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.restore();

      // the player: a white arrow pointing up, with a faint view cone
      g.fillStyle = 'rgba(255, 255, 255, 0.08)';
      g.beginPath();
      g.moveTo(SIZE / 2, SIZE / 2);
      g.lineTo(SIZE / 2 - 40, SIZE / 2 - 70);
      g.lineTo(SIZE / 2 + 40, SIZE / 2 - 70);
      g.fill();
      g.fillStyle = '#f4f4f4';
      g.beginPath();
      g.moveTo(SIZE / 2, SIZE / 2 - 7);
      g.lineTo(SIZE / 2 - 5, SIZE / 2 + 5);
      g.lineTo(SIZE / 2, SIZE / 2 + 2);
      g.lineTo(SIZE / 2 + 5, SIZE / 2 + 5);
      g.fill();

      g.strokeStyle = 'rgba(125, 255, 90, 0.35)';
      g.lineWidth = 1;
      g.strokeRect(0.5, 0.5, SIZE - 1, SIZE - 1);
    };
    draw();
    return () => cancelAnimationFrame(frame);
  }, [runtime]);

  return <canvas ref={canvas} className="play__radar" style={{ width: SIZE, height: SIZE }} aria-hidden="true" />;
}
