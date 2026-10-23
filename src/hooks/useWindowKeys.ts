import { useEffect, useRef } from 'react';
import { topWindow, useStore, type WindowId } from '../state/context';
import { isTyping } from '../utils/format';

/** Keyboard shortcuts that only apply while the given window is on top (e.g. number keys in the buy menu). */
export function useWindowKeys(id: WindowId, handler: (e: KeyboardEvent) => void) {
  const { state } = useStore();
  const isTop = topWindow(state) === id;
  const handlerRef = useRef(handler);

  useEffect(() => {
    handlerRef.current = handler;
  });

  useEffect(() => {
    if (!isTop) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.ctrlKey || e.metaKey || e.altKey || isTyping(e.target)) return;
      handlerRef.current(e);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isTop]);
}
