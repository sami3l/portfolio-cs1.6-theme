import { createContext, useContext } from 'react';

export type WindowId =
  | 'about'
  | 'projects'
  | 'project'
  | 'skills'
  | 'scoreboard'
  | 'options'
  | 'console'
  | 'quit';

export type View = 'game' | 'resume' | 'goodbye' | 'play';
export type Weapon = 'rifle' | 'sniper' | 'pistol' | 'knife' | 'grenade';
export type Team = 'ct' | 't';

export interface Kill {
  id: number;
  killer: string;
  victim: string;
  weapon: Weapon;
  team: Team;
  headshot?: boolean;
}

export interface Settings {
  sound: boolean;
  theme: 'classic' | 'dark';
  playerName: string;
  /** 3D menu background (desktop only). */
  scene3d: boolean;
}

export interface State {
  view: View;
  /** Open windows, bottom to top. The last one has focus. */
  stack: WindowId[];
  projectId: string | null;
  /** Project whose "connecting to server" screen is showing, before its window opens. */
  connecting: string | null;
  kills: Kill[];
  killSeq: number;
  settings: Settings;
}

export interface Actions {
  open: (id: WindowId) => void;
  close: (id: WindowId) => void;
  toggle: (id: WindowId) => void;
  closeTop: () => void;
  openProject: (projectId: string) => void;
  /** Shows the connecting screen, then opens the project. Use for user-initiated opens. */
  connect: (projectId: string) => void;
  cancelConnect: () => void;
  kill: (kill: Omit<Kill, 'id' | 'team'> & { team?: Team }) => void;
  expireKill: (id: number) => void;
  setSettings: (patch: Partial<Settings>) => void;
  setView: (view: View) => void;
  syncHash: (hash: string) => void;
}

export const StoreContext = createContext<{ state: State; actions: Actions } | null>(null);

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>');
  return ctx;
}

export const topWindow = (state: State): WindowId | undefined => state.stack[state.stack.length - 1];
