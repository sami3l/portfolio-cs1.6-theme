import * as THREE from 'three';

// Shared by the menu background and Play mode, so both look like the same town.

export const SAND = '#d9b47c';
export const WALL = '#c8975c';
export const TRIM = '#a87a45';
export const WOOD = '#6e4a28';
export const HORIZON = '#e9b46c';

export function canvasTexture(width: number, height: number, draw: (g: CanvasRenderingContext2D) => void) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  draw(canvas.getContext('2d')!);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export const crateTexture = () =>
  canvasTexture(256, 256, (g) => {
    for (let y = 0; y < 256; y += 32) {
      g.fillStyle = (y / 32) % 2 ? '#94733f' : '#86663a';
      g.fillRect(0, y, 256, 32);
    }
    g.strokeStyle = '#5e4423';
    g.lineWidth = 24;
    g.strokeRect(12, 12, 232, 232);
    g.beginPath();
    g.moveTo(24, 232);
    g.lineTo(232, 24);
    g.stroke();
  });

/** Small seeded PRNG so the town looks the same on every visit. */
export function mulberry32(seed: number) {
  return () => {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
