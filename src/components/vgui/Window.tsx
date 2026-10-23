import { useEffect, useRef, type ReactNode, type RefObject } from 'react';
import { sfx } from '../../audio/sfx';
import { useDraggable } from '../../hooks/useDraggable';
import { useStore, type WindowId } from '../../state/context';

interface WindowProps {
  id: WindowId;
  title: string;
  width: number;
  height: number;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  /** Element to focus when the window opens; defaults to the window itself. */
  initialFocus?: RefObject<HTMLElement | null>;
}

/** Centered in the space right of the main menu, cascading a little for each open window. */
function initialPosition(width: number, height: number, cascade: number) {
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const w = Math.min(width, vw - 32);
  const h = Math.min(height, vh - 32);
  const left = vw >= 1100 ? 340 : 0;
  const offset = (cascade % 5) * 24;
  return {
    x: Math.max(16, Math.min(Math.round(left + (vw - left - w) / 2) + offset, vw - w - 16)),
    y: Math.max(16, Math.round((vh - h) / 2) + offset - 24),
  };
}

export function Window({ id, title, width, height, children, footer, className = '', initialFocus }: WindowProps) {
  const { state, actions } = useStore();
  const ref = useRef<HTMLElement>(null);
  const z = state.stack.indexOf(id);
  const focused = z === state.stack.length - 1;
  const { pos, dragHandlers } = useDraggable(ref, () => initialPosition(width, height, state.stack.length - 1));
  const titleId = `window-title-${id}`;

  useEffect(() => {
    sfx.open();
    (initialFocus?.current ?? ref.current)?.focus({ preventScroll: true });
  }, [initialFocus]);

  // When the window above closes, take focus back so keyboard users aren't dropped on <body>.
  useEffect(() => {
    if (focused && (!document.activeElement || document.activeElement === document.body)) {
      ref.current?.focus({ preventScroll: true });
    }
  }, [focused]);

  const bringToFront = () => {
    if (!focused) actions.open(id);
  };

  return (
    <section
      ref={ref}
      role="dialog"
      aria-labelledby={titleId}
      tabIndex={-1}
      className={`vgui-window ${focused ? 'is-focused' : ''} ${className}`}
      style={{ left: pos.x, top: pos.y, width, maxHeight: `min(${height}px, calc(100dvh - 32px))`, zIndex: 10 + z }}
      onPointerDown={bringToFront}
      onFocus={bringToFront}
    >
      <header className="vgui-titlebar" {...dragHandlers}>
        <h2 id={titleId} className="vgui-titlebar__title">
          {title}
        </h2>
        <button
          type="button"
          className="vgui-close"
          aria-label={`Close ${title}`}
          onPointerDown={(e) => e.stopPropagation()}
          onClick={() => {
            sfx.click();
            actions.close(id);
          }}
        >
          ×
        </button>
      </header>
      <div className="vgui-body">{children}</div>
      {footer && <footer className="vgui-footer">{footer}</footer>}
    </section>
  );
}
