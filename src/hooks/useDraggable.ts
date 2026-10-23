import { useRef, useState, type PointerEvent, type RefObject } from 'react';
import { isMobile } from '../utils/format';

export interface Point {
  x: number;
  y: number;
}

const clamp = (n: number, min: number, max: number) => Math.min(Math.max(n, min), max);

/** Drag a window by its title bar. Keeps at least part of the title bar on screen; off on mobile. */
export function useDraggable(ref: RefObject<HTMLElement | null>, initial: () => Point) {
  const [pos, setPos] = useState(initial);
  const offset = useRef<Point | null>(null);

  const onPointerDown = (e: PointerEvent<HTMLElement>) => {
    if (e.button !== 0 || isMobile()) return;
    offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e: PointerEvent<HTMLElement>) => {
    if (!offset.current) return;
    const width = ref.current?.offsetWidth ?? 200;
    setPos({
      x: clamp(e.clientX - offset.current.x, 80 - width, window.innerWidth - 80),
      y: clamp(e.clientY - offset.current.y, 0, window.innerHeight - 32),
    });
  };

  const onPointerUp = (e: PointerEvent<HTMLElement>) => {
    offset.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
  };

  return { pos, dragHandlers: { onPointerDown, onPointerMove, onPointerUp, onPointerCancel: onPointerUp } };
}
