import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { useStore } from '../state/context';
import { sceneSupport } from '../utils/scene';
import { ErrorBoundary } from './ErrorBoundary';

// Three.js is only downloaded when the 3D scene is actually used.
const Scene3D = lazy(() => import('./scene/Scene3D'));

/**
 * An original desert-town scene in the spirit of de_dust (no game textures), split into
 * three layers that drift with the pointer for a little parallax.
 */
export function Background() {
  const { state } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const [support] = useState(sceneSupport);
  const [ready, setReady] = useState(false);
  const use3D = support.available && state.settings.scene3d;

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let frame = 0;
    const onMove = (e: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        el.style.setProperty('--px', ((e.clientX / window.innerWidth) * 2 - 1).toFixed(3));
        el.style.setProperty('--py', ((e.clientY / window.innerHeight) * 2 - 1).toFixed(3));
      });
    };
    window.addEventListener('pointermove', onMove);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('pointermove', onMove);
    };
  }, []);

  return (
    <div ref={ref} className="bg" aria-hidden="true">
      <svg viewBox="0 0 1600 900" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#f6d9a0" />
            <stop offset="0.55" stopColor="#efc283" />
            <stop offset="1" stopColor="#e2a660" />
          </linearGradient>
          <radialGradient id="sun" cx="0.5" cy="0.5" r="0.5">
            <stop offset="0" stopColor="#fff6dc" stopOpacity="0.95" />
            <stop offset="1" stopColor="#fff6dc" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="wall" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#d2a066" />
            <stop offset="1" stopColor="#b98a52" />
          </linearGradient>
          <linearGradient id="sand" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0" stopColor="#e2bd84" />
            <stop offset="1" stopColor="#c99a5c" />
          </linearGradient>
          <g id="crate">
            <rect width="140" height="140" fill="#8b6a3c" />
            <rect x="8" y="8" width="124" height="124" fill="none" stroke="#6b4f28" strokeWidth="10" />
            <path d="M14 126 126 14" stroke="#6b4f28" strokeWidth="12" />
            <path d="M0 0h140v6H0z" fill="#a8844f" />
          </g>
        </defs>

        <rect width="1600" height="900" fill="url(#sky)" />
        <circle cx="1310" cy="150" r="190" fill="url(#sun)" />

        <g className="bg__layer bg__layer--far">
          <path d="M520 560V420h140v-40h120v180zM820 560V360h90v-30h70v230zM1000 560V430h160v130zM1180 560V380h120l40 30v150zM1360 560V450h260v110z" fill="#d9b47c" />
          <path d="M560 450h24v30h-24zM700 420h20v28h-20zM860 400h22v30h-22zM1040 460h26v34h-26zM1220 420h22v30h-22zM1420 480h24v30h-24z" fill="#8a6a42" />
        </g>

        <g className="bg__layer bg__layer--mid">
          <path
            fillRule="evenodd"
            fill="url(#wall)"
            d="M560 250H1660V730H560ZM930 730V470a110 110 0 0 1 220 0V730Z"
          />
          <path d="M560 250H1660v18H560z" fill="#a87a45" />
          <path d="M600 330h90v26h-90zM720 380h90v26h-90zM1240 320h90v26h-90zM1380 400h90v26h-90zM1260 560h90v26h-90zM640 600h90v26h-90z" fill="#c09159" opacity="0.7" />
          {/* half-open wooden double door in the arch */}
          <path d="M940 500h86v230h-86z" fill="#6e4a28" />
          <path d="M954 512v206M976 512v206M998 512v206M1012 512v206" stroke="#5a3b1e" strokeWidth="3" />
          <path d="M1100 500l46-14v258l-46-14z" fill="#5f3f20" />
          {/* painted bombsite-style direction sign */}
          <g transform="translate(720 450)" fill="#3c5a86" opacity="0.85">
            <path d="M0 22h60V8l34 24-34 24V40H0z" />
            <text x="112" y="50" fontFamily="Impact, Arial Black, sans-serif" fontSize="58">A</text>
          </g>
        </g>

        <g className="bg__layer bg__layer--near">
          <path d="M0 700 L1600 670 V900 H0Z" fill="url(#sand)" />
          <ellipse cx="1330" cy="770" rx="230" ry="28" fill="#000" opacity="0.18" />
          <use href="#crate" x="1170" y="620" />
          <use href="#crate" x="1310" y="630" />
          <use href="#crate" x="1240" y="480" />
          <path d="M0 140h300v760H0z" fill="#7c5631" />
          <path d="M300 140h26v760h-26z" fill="#5e3f22" />
          <path d="M0 140h326v24H0z" fill="#9a6d3c" />
        </g>
      </svg>
      {use3D && (
        <ErrorBoundary>
          <Suspense fallback={null}>
            <div className={`bg3d ${ready ? 'is-ready' : ''}`}>
              <Scene3D still={support.still} onReady={() => setReady(true)} />
            </div>
          </Suspense>
        </ErrorBoundary>
      )}
      <div className="bg__shade" />
    </div>
  );
}
