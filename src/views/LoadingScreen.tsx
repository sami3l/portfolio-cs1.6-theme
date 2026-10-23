import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/vgui/Button';
import { portfolio } from '../data/portfolio';
import { isMobile } from '../utils/format';
import { markSeen } from '../utils/loading';

const STAGES = [
  `Connecting to ${portfolio.profile.nickname}'s portfolio…`,
  'Retrieving server info…',
  'Precaching resources…',
  'Sending client info…',
  'Loading de_career…',
];

const TIPS = [
  { text: 'Hold TAB to check the scoreboard: work experience and education.', keyboard: true },
  { text: 'Press B to open the buy menu and browse my skills.', keyboard: true },
  { text: "Press ~ to open the console, then try 'connect stratospend'.", keyboard: true },
  { text: "In the console, 'cv en' or 'cv fr' downloads my CV." },
  { text: 'Find Servers lists my projects. Click a server twice to connect.' },
  { text: 'Prefer plain text? Open the résumé view from the bottom-right corner.' },
];


/**
 * CS-style "connecting to server" screen shown over the menu on first load.
 * Any key, click or the Skip button ends it early.
 */
export function LoadingScreen({ onDone }: { onDone: () => void }) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const duration = reduced ? 800 : 2600;
  const [progress, setProgress] = useState(0);
  const [leaving, setLeaving] = useState(false);
  const [tip] = useState(() => {
    const pool = TIPS.filter((t) => !t.keyboard || !isMobile());
    return pool[Math.floor(Math.random() * pool.length)].text;
  });
  const doneRef = useRef(onDone);

  useEffect(() => {
    doneRef.current = onDone;
  });

  useEffect(() => {
    markSeen();
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
      else setLeaving(true);
    });
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  // Swallow keys while loading (so ~ or B don't fire underneath) and treat them as "skip".
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      e.preventDefault();
      e.stopPropagation();
      setLeaving(true);
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  useEffect(() => {
    if (!leaving) return;
    const timer = setTimeout(() => doneRef.current(), reduced ? 0 : 250);
    return () => clearTimeout(timer);
  }, [leaving, reduced]);

  const stage = STAGES[Math.min(STAGES.length - 1, Math.floor(progress * STAGES.length))];

  return (
    <div className={`loading ${leaving ? 'is-leaving' : ''}`} onClick={() => setLeaving(true)} aria-busy={!leaving}>
      <div className="loading__map">
        <p className="loading__label">Map</p>
        <h2 className="loading__name">de_career</h2>
        <p className="loading__sub">
          {portfolio.profile.name} · {portfolio.profile.title}
        </p>
      </div>

      <section className="loading__dialog vgui-window is-focused" aria-labelledby="loading-title" onClick={(e) => e.stopPropagation()}>
        <header className="vgui-titlebar">
          <h2 id="loading-title" className="vgui-titlebar__title">
            Loading…
          </h2>
        </header>
        <div className="vgui-body">
          <p className="loading__stage" role="status">
            {stage}
          </p>
          <div
            className="loading__bar vgui-inset"
            role="progressbar"
            aria-label="Loading"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <footer className="vgui-footer">
          <Button autoFocus onClick={() => setLeaving(true)}>
            Skip
          </Button>
        </footer>
      </section>

      <p className="loading__tip">
        <strong>Tip:</strong> {tip}
      </p>
    </div>
  );
}
