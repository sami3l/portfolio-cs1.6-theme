import { useEffect, useRef } from 'react';
import type { State } from '../state/context';
import { hashFor, isRoutable } from '../state/reducer';

/**
 * Mirrors the top window in the URL hash so sections are linkable, and lets the
 * browser's back button close windows. Opening a window pushes a history entry;
 * closing or refocusing one only replaces the current entry.
 */
export function useHashSync(state: State, syncHash: (hash: string) => void) {
  const hash = hashFor(state);
  // Full-page views (résumé, Play mode) count as the deepest level, so entering them pushes history.
  const depth =
    state.view === 'resume' || state.view === 'play' ? Number.MAX_SAFE_INTEGER : state.stack.filter(isRoutable).length;
  const prevDepth = useRef(depth);

  useEffect(() => {
    const grew = depth > prevDepth.current;
    prevDepth.current = depth;
    if (location.hash.slice(1) === hash) return;
    const url = hash ? `#${hash}` : location.pathname + location.search;
    if (grew) history.pushState(null, '', url);
    else history.replaceState(null, '', url);
  }, [hash, depth]);

  useEffect(() => {
    const onNavigate = () => syncHash(location.hash.slice(1));
    window.addEventListener('hashchange', onNavigate);
    window.addEventListener('popstate', onNavigate);
    return () => {
      window.removeEventListener('hashchange', onNavigate);
      window.removeEventListener('popstate', onNavigate);
    };
  }, [syncHash]);
}
