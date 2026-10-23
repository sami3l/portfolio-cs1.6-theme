import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Background } from './components/Background';
import { MainMenu } from './components/MainMenu';
import { useHotkeys } from './hooks/useHotkeys';
import { KillFeed } from './hud/KillFeed';
import { useStore } from './state/context';
import { StoreProvider } from './state/StoreProvider';
import { PlayUnavailable } from './play/PlayUnavailable';
import { isMobile } from './utils/format';
import { sceneSupport } from './utils/scene';
import { Goodbye } from './views/Goodbye';
import { markSeen, shouldShowLoading } from './utils/loading';
import { ConnectLoading, IntroLoading } from './views/LoadingScreen';
import { Resume } from './views/Resume';
import { WindowLayer } from './windows/WindowLayer';

// Play mode (and its share of Three.js) only downloads when someone starts it.
const PlayMode = lazy(() => import('./play/PlayMode'));

export default function App() {
  return (
    <StoreProvider>
      <Game />
    </StoreProvider>
  );
}

function Game() {
  const { state, actions } = useStore();
  const greeted = useRef(false);
  const [loading, setLoading] = useState(() => state.view === 'game' && shouldShowLoading());
  useHotkeys();

  useEffect(() => {
    if (loading) markSeen();
  }, [loading]);

  useEffect(() => {
    if (greeted.current) return;
    greeted.current = true;
    actions.kill({ killer: state.settings.playerName, weapon: 'knife', victim: 'boredom' });
  }, [actions, state.settings.playerName]);

  if (state.view === 'resume') return <Resume />;
  if (state.view === 'goodbye') return <Goodbye />;
  if (state.view === 'play') {
    const support = sceneSupport();
    if (isMobile() || !support.available) return <PlayUnavailable reason={support.note} />;
    return (
      <div className="play-root">
        <Suspense fallback={<p className="play__loading">Loading de_career…</p>}>
          <PlayMode />
        </Suspense>
        <KillFeed />
      </div>
    );
  }

  return (
    <div className="desktop">
      <Background />
      <MainMenu />
      <WindowLayer />
      <KillFeed />
      {loading && <IntroLoading onDone={() => setLoading(false)} />}
      {!loading && state.connecting && <ConnectLoading />}
      <footer className="desktop__footer">
        <span className="desktop__keys">
          Hold <kbd>TAB</kbd> scoreboard · <kbd>B</kbd> buy menu · <kbd>~</kbd> console · <kbd>Esc</kbd> close
        </span>
        <a href="#resume">Plain résumé view</a>
      </footer>
    </div>
  );
}
