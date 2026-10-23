import { useState } from 'react';
import type { MapOverview as Overview, OverviewZone, RouteKind } from '../data/types';

const W = 1000;
const H = 640;

const ROUTE_LABELS: Record<RouteKind, string> = {
  build: 'Build & publish',
  deploy: 'Deploy',
  auth: 'Single sign-on',
  secret: 'Secrets',
  metrics: 'Metrics',
};

/** Point where the line from a zone's centre towards (tx, ty) leaves the zone's rectangle. */
function edgePoint(z: OverviewZone, tx: number, ty: number) {
  const cx = z.x + z.w / 2;
  const cy = z.y + z.h / 2;
  const dx = tx - cx;
  const dy = ty - cy;
  const scale = 1 / Math.max(Math.abs(dx) / (z.w / 2 + 6), Math.abs(dy) / (z.h / 2 + 6), 1e-6);
  return { x: cx + dx * scale, y: cy + dy * scale };
}

/**
 * A project's architecture drawn like a CS map overview: zones are rooms, bombsites mark
 * where things land, and routes show how code, secrets and metrics move between them.
 */
export function MapOverview({ overview }: { overview: Overview }) {
  const [active, setActive] = useState<string | null>(null);
  const zones = new Map(overview.zones.map((z) => [z.id, z]));
  const current = active ? zones.get(active) : undefined;
  const kinds = [...new Set(overview.routes.map((r) => r.kind))];

  const isLinked = (from: string, to: string) => active !== null && (from === active || to === active);

  return (
    <figure className="radar">
      <svg viewBox={`0 0 ${W} ${H}`} className="radar__map" role="group" aria-label={`Architecture overview: ${overview.name}`}>
        <defs>
          <pattern id="radar-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M40 0H0V40" fill="none" className="radar__grid" />
          </pattern>
          {kinds.map((k) => (
            <marker key={k} id={`radar-arrow-${k}`} viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
              <path d="M0 0L10 5L0 10z" className={`radar__arrow radar__arrow--${k}`} />
            </marker>
          ))}
        </defs>

        <rect width={W} height={H} className="radar__bg" />
        <rect width={W} height={H} fill="url(#radar-grid)" />
        <text x={W - 20} y={H - 18} textAnchor="end" className="radar__name">
          {overview.name}
        </text>

        <g aria-hidden="true">
          {overview.routes.map((r) => {
            const a = zones.get(r.from);
            const b = zones.get(r.to);
            if (!a || !b) return null;
            const p1 = edgePoint(a, b.x + b.w / 2, b.y + b.h / 2);
            const p2 = edgePoint(b, a.x + a.w / 2, a.y + a.h / 2);
            const dim = active !== null && !isLinked(r.from, r.to);
            return (
              <line
                key={`${r.from}-${r.to}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                markerEnd={`url(#radar-arrow-${r.kind})`}
                className={`radar__route radar__route--${r.kind} ${dim ? 'is-dim' : ''}`}
              />
            );
          })}
        </g>

        {overview.zones.map((z) => {
          const dim = active !== null && active !== z.id && !overview.routes.some((r) => isLinked(r.from, r.to) && (r.from === z.id || r.to === z.id));
          const bombsite = z.marker === 'A' || z.marker === 'B';
          return (
            <g
              key={z.id}
              className={`radar__zone ${active === z.id ? 'is-active' : ''} ${dim ? 'is-dim' : ''}`}
              tabIndex={0}
              role="button"
              aria-pressed={active === z.id}
              aria-label={`${z.label}${z.sub ? `, ${z.sub}` : ''}`}
              onMouseEnter={() => setActive(z.id)}
              onFocus={() => setActive(z.id)}
              onClick={() => setActive(z.id)}
            >
              <rect x={z.x} y={z.y} width={z.w} height={z.h} rx="6" className={`radar__room ${bombsite ? 'radar__room--site' : ''}`} />
              <text x={z.x + z.w / 2} y={z.y + z.h / 2 - (z.sub ? 6 : -6)} textAnchor="middle" className="radar__label">
                {z.label}
              </text>
              {z.sub && (
                <text x={z.x + z.w / 2} y={z.y + z.h / 2 + 18} textAnchor="middle" className="radar__sub">
                  {z.sub}
                </text>
              )}
              {z.marker && (
                <g className={`radar__marker radar__marker--${bombsite ? 'site' : z.marker.toLowerCase()}`}>
                  <circle cx={z.x + z.w - 4} cy={z.y + 4} r="17" />
                  <text x={z.x + z.w - 4} y={z.y + 10} textAnchor="middle">
                    {z.marker}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </svg>

      <figcaption className="radar__info vgui-inset" aria-live="polite">
        {current ? (
          <>
            <strong>{current.label}</strong>
            {current.sub && <span className="radar__info-sub"> · {current.sub}</span>}
            <p>{current.detail}</p>
          </>
        ) : (
          <p className="hint">Hover, tap or tab through the zones to see what each part does.</p>
        )}
      </figcaption>

      <ul className="radar__legend">
        {kinds.map((k) => (
          <li key={k}>
            <span className={`radar__swatch radar__route--${k}`} aria-hidden="true" />
            {ROUTE_LABELS[k]}
          </li>
        ))}
        <li>
          <span className="radar__marker-key">A</span> <span className="radar__marker-key">B</span> where things land
        </li>
      </ul>
    </figure>
  );
}
