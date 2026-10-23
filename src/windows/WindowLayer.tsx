import type { ComponentType } from 'react';
import { Console } from '../hud/Console';
import { useStore, type WindowId } from '../state/context';
import { BuyMenu } from './BuyMenu';
import { MotdWindow } from './MotdWindow';
import { OptionsWindow } from './OptionsWindow';
import { QuitDialog } from './QuitDialog';
import { Scoreboard } from './Scoreboard';
import { ServerBrowser } from './ServerBrowser';
import { ServerInfoDialog } from './ServerInfoDialog';

// Rendered in this fixed order (z-order comes from the store) so focusing a window never remounts it.
const WINDOWS: Record<WindowId, ComponentType> = {
  about: MotdWindow,
  projects: ServerBrowser,
  project: ServerInfoDialog,
  skills: BuyMenu,
  scoreboard: Scoreboard,
  options: OptionsWindow,
  console: Console,
  quit: QuitDialog,
};

export function WindowLayer() {
  const { state } = useStore();
  return (
    <main className="window-layer">
      {(Object.keys(WINDOWS) as WindowId[])
        .filter((id) => state.stack.includes(id))
        .map((id) => {
          const Component = WINDOWS[id];
          return <Component key={id} />;
        })}
    </main>
  );
}
