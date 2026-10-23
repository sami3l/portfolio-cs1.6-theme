import type { KeyboardEvent, ReactNode } from 'react';
import { sfx } from '../../audio/sfx';

interface TabsProps<T extends string> {
  idPrefix: string;
  tabs: { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
  children: ReactNode;
}

/** VGUI property-sheet tabs with arrow-key navigation (WAI-ARIA tabs pattern). */
export function Tabs<T extends string>({ idPrefix, tabs, active, onChange, children }: TabsProps<T>) {
  const tabId = (id: T) => `${idPrefix}-tab-${id}`;

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === active);
    const next = tabs[(i + (e.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length];
    onChange(next.id);
    document.getElementById(tabId(next.id))?.focus();
  };

  return (
    <>
      <div role="tablist" className="vgui-tabs" onKeyDown={onKeyDown}>
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            id={tabId(t.id)}
            aria-selected={t.id === active}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={t.id === active ? 0 : -1}
            className="vgui-tab"
            onClick={() => {
              sfx.click();
              onChange(t.id);
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={tabId(active)} className="vgui-tabpanel">
        {children}
      </div>
    </>
  );
}
