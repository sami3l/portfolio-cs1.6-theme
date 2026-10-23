import * as THREE from 'three';
import { canvasTexture } from '../components/scene/materials';
import { portfolio } from '../data/portfolio';
import { formatPeriod } from '../utils/format';
import type { SignContent } from './map';

// Canvas-drawn textures for everything written in the world, generated from portfolio data.

const UI = 'Tahoma, Verdana, sans-serif';
const HUD = '"Share Tech Mono", Consolas, monospace';
const STENCIL = '"Black Ops One", Impact, "Arial Black", sans-serif';

/** Shrink the font until the text fits the width. */
function fitText(g: CanvasRenderingContext2D, text: string, maxWidth: number, size: number, family: string, weight = '') {
  let s = size;
  do {
    g.font = `${weight} ${s}px ${family}`;
    s -= 2;
  } while (g.measureText(text).width > maxWidth && s > 10);
}

const plate = (title: string, subtitle?: string) =>
  canvasTexture(512, 144, (g) => {
    g.fillStyle = '#2f2a20';
    g.fillRect(0, 0, 512, 144);
    g.strokeStyle = '#8c7a54';
    g.lineWidth = 6;
    g.strokeRect(6, 6, 500, 132);
    g.textAlign = 'center';
    g.fillStyle = '#f2e6c8';
    fitText(g, title, 470, 54, STENCIL);
    g.fillText(title, 256, subtitle ? 74 : 92);
    if (subtitle) {
      g.fillStyle = '#c4b550';
      g.font = `28px ${HUD}`;
      g.fillText(subtitle, 256, 118);
    }
  });

const motd = () =>
  canvasTexture(512, 384, (g) => {
    const { profile } = portfolio;
    g.fillStyle = '#e9dcbc';
    g.fillRect(0, 0, 512, 384);
    g.fillStyle = '#4c5844';
    g.fillRect(0, 0, 512, 64);
    g.fillStyle = '#f2ecd8';
    g.font = `bold 30px ${UI}`;
    g.textAlign = 'center';
    g.fillText('MESSAGE OF THE DAY', 256, 43);
    g.fillStyle = '#2a2418';
    fitText(g, profile.name, 460, 44, STENCIL);
    g.fillText(profile.name, 256, 136);
    g.font = `26px ${UI}`;
    g.fillStyle = '#5a4a2a';
    g.fillText(profile.title, 256, 182);
    g.fillText(profile.location, 256, 218);
    g.fillStyle = '#7a3a2a';
    g.font = `bold 24px ${UI}`;
    g.fillText('Press E to read', 256, 340);
  });

const scoreboard = () =>
  canvasTexture(1024, 384, (g) => {
    g.fillStyle = 'rgba(12, 16, 10, 0.92)';
    g.fillRect(0, 0, 1024, 384);
    g.font = `30px ${HUD}`;
    g.fillStyle = '#ffa01e';
    g.fillText(`${portfolio.profile.nickname}'s career · de_career`, 28, 46);
    let y = 96;
    for (const [team, label, colour] of [
      ['ct', 'Counter-Terrorists · work', '#99ccff'],
      ['t', 'Terrorists · education', '#ff5a4a'],
    ] as const) {
      g.fillStyle = colour;
      g.font = `bold 24px ${UI}`;
      g.fillText(label, 28, y);
      g.fillRect(28, y + 8, 968, 2);
      y += 40;
      g.font = `22px ${UI}`;
      for (const e of portfolio.experience.filter((x) => x.team === team)) {
        g.fillStyle = '#e8ecdf';
        fitText(g, e.title, 480, 22, UI);
        g.fillText(e.title, 40, y);
        g.font = `22px ${UI}`;
        g.fillStyle = '#a0aa95';
        fitText(g, e.org, 280, 22, UI);
        g.fillText(e.org, 540, y);
        g.font = `22px ${UI}`;
        g.fillText(formatPeriod(e), 840, y);
        y += 32;
      }
      y += 16;
    }
    g.fillStyle = '#c4b550';
    g.font = `bold 22px ${UI}`;
    g.fillText('Press E for details', 28, 366);
  });

const overview = (projectId: string) =>
  canvasTexture(1000, 640, (g) => {
    const ov = portfolio.projects.find((p) => p.id === projectId)?.overview;
    g.fillStyle = '#0d130c';
    g.fillRect(0, 0, 1000, 640);
    g.strokeStyle = 'rgba(125, 255, 90, 0.07)';
    for (let x = 0; x < 1000; x += 40) g.strokeRect(x, 0, 40, 640);
    if (!ov) return;
    const zones = new Map(ov.zones.map((z) => [z.id, z]));
    const colours: Record<string, string> = { build: '#c4b550', deploy: '#7dff5a', auth: '#99ccff', secret: '#ffa01e', metrics: '#d58cff' };
    g.lineWidth = 4;
    g.setLineDash([12, 8]);
    for (const r of ov.routes) {
      const a = zones.get(r.from);
      const b = zones.get(r.to);
      if (!a || !b) continue;
      g.strokeStyle = colours[r.kind];
      g.beginPath();
      g.moveTo(a.x + a.w / 2, a.y + a.h / 2);
      g.lineTo(b.x + b.w / 2, b.y + b.h / 2);
      g.stroke();
    }
    g.setLineDash([]);
    g.textAlign = 'center';
    for (const z of ov.zones) {
      const site = z.marker === 'A' || z.marker === 'B';
      g.fillStyle = site ? '#3a1612' : '#1d2418';
      g.fillRect(z.x, z.y, z.w, z.h);
      g.strokeStyle = site ? '#ff5a4a' : 'rgba(216, 222, 211, 0.6)';
      g.lineWidth = 3;
      g.strokeRect(z.x, z.y, z.w, z.h);
      g.fillStyle = '#e8ecdf';
      fitText(g, z.label, z.w - 12, 22, UI, 'bold');
      g.fillText(z.label, z.x + z.w / 2, z.y + z.h / 2 + 8);
    }
    g.fillStyle = 'rgba(125, 255, 90, 0.5)';
    g.font = `26px ${HUD}`;
    g.textAlign = 'right';
    g.fillText(ov.name, 980, 625);
  });

const letter = (l: string) =>
  canvasTexture(256, 256, (g) => {
    g.fillStyle = 'rgba(176, 48, 42, 0.85)';
    g.font = `220px ${STENCIL}`;
    g.textAlign = 'center';
    g.fillText(l, 128, 212);
  });

const door = () =>
  canvasTexture(64, 112, (g) => {
    const grad = g.createLinearGradient(0, 0, 0, 112);
    grad.addColorStop(0, '#1a120a');
    grad.addColorStop(1, '#2e2014');
    g.fillStyle = grad;
    g.fillRect(0, 0, 64, 112);
    g.strokeStyle = '#6e4a28';
    g.lineWidth = 6;
    g.strokeRect(3, 3, 58, 109);
  });

export function signTexture(content: SignContent): THREE.Texture {
  switch (content.type) {
    case 'plate':
      return plate(content.title, content.subtitle);
    case 'motd':
      return motd();
    case 'scoreboard':
      return scoreboard();
    case 'overview':
      return overview(content.projectId);
    case 'letter':
      return letter(content.letter);
    case 'door':
      return door();
  }
}

/** Floating label over a CV pickup. */
export const pickupLabel = (text: string) =>
  canvasTexture(256, 96, (g) => {
    g.fillStyle = 'rgba(0, 0, 0, 0.55)';
    g.fillRect(0, 0, 256, 96);
    g.fillStyle = '#ffa01e';
    g.font = `bold 44px ${HUD}`;
    g.textAlign = 'center';
    g.fillText(text, 128, 64);
  });
