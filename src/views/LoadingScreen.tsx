import { useEffect, useRef, useState } from 'react';
import { Button } from '../components/vgui/Button';
import { portfolio } from '../data/portfolio';
import { useStore } from '../state/context';
import { isMobile, mapName } from '../utils/format';
import { screenshotsFor } from '../utils/screenshots';

const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

const TIPS = [
  { text: 'Hold TAB to check the scoreboard: work experience and education.', keyboard: true },
  { text: 'Press B to open the buy menu and browse my skills.', keyboard: true },
  { text: "Press ~ to open the console, then try 'connect stratospend'.", keyboard: true },
  { text: "In the console, 'cv en' or 'cv fr' downloads my CV." },
  { text: 'Find Servers lists my projects. Click a server twice to connect.' },
  { text: 'Prefer plain text? Open the résumé view from the bottom-right corner.' },
];

/** The first-visit screen: "connecting" to the portfolio itself, with a random tip. */
export function IntroLoading({ onDone }: { onDone: () => void }) {
  const [tip] = useState(() => {
    const pool = TIPS.filter((t) => !t.keyboard || !isMobile());
    return pool[Math.floor(Math.random() * pool.length)].text;
  });
  return (
    <LoadingScreen
      title="Loading…"
      map="de_career"
      subtitle={`${portfolio.profile.name} · ${portfolio.profile.title}`}
      stages={[
        `Connecting to ${portfolio.profile.nickname}'s portfolio…`,
        'Retrieving server info…',
        'Precaching resources…',
        'Sending client info…',
        'Loading de_career…',
      ]}
      duration={reducedMotion() ? 800 : 2600}
      note={{ label: 'Tip', text: tip }}
      onDone={onDone}
    />
  );
}

/** Shown between picking a server (project) and its Server Info window. Esc cancels. */
export function ConnectLoading() {
  const { state, actions } = useStore();
  const project = portfolio.projects.find((p) => p.id === state.connecting);
  if (!project) return null;
  const map = mapName(project);
  const shots = screenshotsFor(project).length;

  return (
    <LoadingScreen
      key={project.id}
      title="Connecting to server"
      map={map}
      subtitle={[project.name, project.org ?? project.role].join(' · ')}
      stages={[
        `Connecting to ${project.name}…`,
        'Retrieving server info…',
        shots ? `Precaching ${shots} screenshot${shots === 1 ? '' : 's'}…` : 'Precaching resources…',
        `Loading ${map}…`,
      ]}
      duration={reducedMotion() ? 500 : 1300}
      note={{ label: 'Stack', text: project.stack.join(' · ') }}
      onDone={() => actions.openProject(project.id)}
      onCancel={actions.cancelConnect}
    />
  );
}

interface LoadingScreenProps {
  title: string;
  map: string;
  subtitle: string;
  stages: string[];
  duration: number;
  note: { label: string; text: string };
  onDone: () => void;
  /** When given, Esc and a Cancel button abort instead of finishing. */
  onCancel?: () => void;
}

/**
 * CS-style loading screen: map name, a staged progress bar and a note.
 * Any key, click or Skip finishes it early.
 */
function LoadingScreen({ title, map, subtitle, stages, duration, note, onDone, onCancel }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [outcome, setOutcome] = useState<'done' | 'cancel' | null>(null);
  const callbacks = useRef({ onDone, onCancel });
  const reduced = reducedMotion();

  useEffect(() => {
    callbacks.current = { onDone, onCancel };
  });

  useEffect(() => {
    const start = performance.now();
    let frame = requestAnimationFrame(function tick(now) {
      const p = Math.min(1, (now - start) / duration);
      setProgress(p);
      if (p < 1) frame = requestAnimationFrame(tick);
      else setOutcome((o) => o ?? 'done');
    });
    return () => cancelAnimationFrame(frame);
  }, [duration]);

  // Swallow keys while loading (so ~ or B don't fire underneath): Esc cancels when possible, anything else skips.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Tab') return;
      e.preventDefault();
      e.stopPropagation();
      setOutcome((o) => o ?? (e.key === 'Escape' && callbacks.current.onCancel ? 'cancel' : 'done'));
    };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, []);

  useEffect(() => {
    if (!outcome) return;
    const timer = setTimeout(() => {
      if (outcome === 'cancel') callbacks.current.onCancel?.();
      else callbacks.current.onDone();
    }, reduced ? 0 : 250);
    return () => clearTimeout(timer);
  }, [outcome, reduced]);

  const finish = (o: 'done' | 'cancel') => setOutcome((prev) => prev ?? o);
  const stage = stages[Math.min(stages.length - 1, Math.floor(progress * stages.length))];

  return (
    <div className={`loading ${outcome ? 'is-leaving' : ''}`} onClick={() => finish('done')} aria-busy={!outcome}>
      <div className="loading__map">
        <p className="loading__label">Map</p>
        <h2 className="loading__name">{map}</h2>
        <p className="loading__sub">{subtitle}</p>
      </div>

      <section className="loading__dialog vgui-window is-focused" aria-labelledby="loading-title" onClick={(e) => e.stopPropagation()}>
        <header className="vgui-titlebar">
          <h2 id="loading-title" className="vgui-titlebar__title">
            {title}
          </h2>
        </header>
        <div className="vgui-body">
          <p className="loading__stage" role="status">
            {stage}
          </p>
          <div
            className="loading__bar vgui-inset"
            role="progressbar"
            aria-label={title}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress * 100)}
          >
            <span style={{ width: `${progress * 100}%` }} />
          </div>
        </div>
        <footer className="vgui-footer">
          {onCancel && <Button onClick={() => finish('cancel')}>Cancel</Button>}
          <Button autoFocus onClick={() => finish('done')}>
            Skip
          </Button>
        </footer>
      </section>

      <p className="loading__tip">
        <strong>{note.label}:</strong> {note.text}
      </p>
    </div>
  );
}
