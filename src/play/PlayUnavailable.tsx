import { Button } from '../components/vgui/Button';
import { useStore } from '../state/context';

/** Shown instead of Play mode on phones or when WebGL is off. Nothing 3D is downloaded. */
export function PlayUnavailable({ reason }: { reason?: string }) {
  const { actions } = useStore();
  return (
    <div className="play play__overlay">
      <section className="vgui-window is-focused play__dialog" aria-labelledby="play-na-title">
        <header className="vgui-titlebar">
          <h2 id="play-na-title" className="vgui-titlebar__title">
            de_career
          </h2>
        </header>
        <div className="vgui-body">
          <p>The walkable map needs a computer with a keyboard and mouse.</p>
          {reason && <p className="hint">{reason}</p>}
          <p>Everything on the map is also in the main menu.</p>
        </div>
        <footer className="vgui-footer">
          <Button autoFocus onClick={() => actions.setView('game')}>
            Back to menu
          </Button>
        </footer>
      </section>
    </div>
  );
}
