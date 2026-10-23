import { useEffect, useRef } from 'react';
import { topWindow, useStore } from '../state/context';
import { isTyping } from '../utils/format';

/**
 * Global game keys: ~ console, B buy menu, Esc closes the top window, and holding TAB
 * shows the scoreboard. TAB only reacts to auto-repeat, so a normal Tab press still
 * moves keyboard focus as usual.
 */
export function useHotkeys() {
  const { state, actions } = useStore();
  const stateRef = useRef(state);

  useEffect(() => {
    stateRef.current = state;
  });

  useEffect(() => {
    let tabHeld = false;

    const onKeyDown = (e: KeyboardEvent) => {
      const s = stateRef.current;
      if ((s.view !== 'game' && s.view !== 'play') || e.ctrlKey || e.metaKey || e.altKey) return;

      if (e.code === 'Backquote' || e.key === '`' || e.key === '~' || e.key === '²') {
        e.preventDefault();
        // In Play mode, free the mouse so the console can be typed in.
        if (document.pointerLockElement) document.exitPointerLock();
        actions.toggle('console');
        return;
      }
      if (e.key === 'Escape') {
        if (topWindow(s)) {
          e.preventDefault();
          actions.closeTop();
        }
        return;
      }
      if (e.key === 'Tab' && (tabHeld || (e.repeat && !s.stack.includes('scoreboard')))) {
        e.preventDefault();
        if (!tabHeld) actions.open('scoreboard');
        tabHeld = true;
        return;
      }
      if (isTyping(e.target)) return;
      // In Play mode, B only works in the buy zone; PlayMode handles it.
      if (s.view === 'game' && e.key.toLowerCase() === 'b' && !e.repeat) actions.open('skills');
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === 'Tab' && tabHeld) {
        tabHeld = false;
        actions.close('scoreboard');
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [actions]);
}
