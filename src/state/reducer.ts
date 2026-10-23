import { portfolio } from '../data/portfolio';
import type { Kill, Settings, State, View, WindowId } from './context';

export type Action =
  | { type: 'open'; id: WindowId }
  | { type: 'close'; id: WindowId }
  | { type: 'toggle'; id: WindowId }
  | { type: 'closeTop' }
  | { type: 'openProject'; projectId: string }
  | { type: 'connect'; projectId: string }
  | { type: 'cancelConnect' }
  | { type: 'kill'; kill: Omit<Kill, 'id'> }
  | { type: 'expireKill'; id: number }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'view'; view: View }
  | { type: 'syncHash'; hash: string };

/** Windows that get their own URL hash; the console and quit dialog are overlays. */
const ROUTABLE: WindowId[] = ['about', 'projects', 'project', 'skills', 'scoreboard', 'options'];
export const isRoutable = (id: WindowId) => ROUTABLE.includes(id);

/** Windows open over Play mode without leaving it; from any other view they open in the menu. */
const stayIn = (view: View): View => (view === 'play' ? 'play' : 'game');

const withTop = (stack: WindowId[], id: WindowId) => [...stack.filter((w) => w !== id), id];

export function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'open':
      return { ...state, view: stayIn(state.view), stack: withTop(state.stack, action.id) };
    case 'close':
      return { ...state, stack: state.stack.filter((w) => w !== action.id) };
    case 'toggle':
      return state.stack[state.stack.length - 1] === action.id
        ? reducer(state, { type: 'close', id: action.id })
        : reducer(state, { type: 'open', id: action.id });
    case 'closeTop':
      return { ...state, stack: state.stack.slice(0, -1) };
    case 'openProject':
      return {
        ...state,
        view: stayIn(state.view),
        connecting: null,
        projectId: action.projectId,
        stack: withTop(state.stack, 'project'),
      };
    case 'connect':
      return { ...state, connecting: action.projectId };
    case 'cancelConnect':
      return { ...state, connecting: null };
    case 'kill': {
      const id = state.killSeq + 1;
      return { ...state, killSeq: id, kills: [...state.kills, { ...action.kill, id }].slice(-5) };
    }
    case 'expireKill':
      return { ...state, kills: state.kills.filter((k) => k.id !== action.id) };
    case 'settings':
      return { ...state, settings: { ...state.settings, ...action.patch } };
    case 'view':
      return { ...state, view: action.view, connecting: null, stack: action.view === 'game' ? state.stack : [] };
    case 'syncHash':
      return applyHash(state, action.hash);
  }
}

/**
 * Brings the state in line with a URL hash (deep link or back/forward navigation).
 * Going back to a window that is already open closes the routable windows opened after it.
 */
export function applyHash(state: State, hash: string): State {
  if (hash === 'resume' || hash === 'play') return { ...state, view: hash, stack: [], connecting: null };
  const game: State = { ...state, view: 'game' };
  if (hash === '') return { ...game, stack: state.stack.filter((w) => !isRoutable(w)) };

  const [head, projectId] = hash.split('/');
  let target: WindowId | undefined;
  if (head === 'projects' && projectId) {
    if (!portfolio.projects.some((p) => p.id === projectId)) return game;
    target = 'project';
    game.projectId = projectId;
  } else {
    target = ROUTABLE.find((w) => w === head && w !== 'project');
  }
  if (!target) return game;

  const at = state.stack.indexOf(target);
  let stack = at === -1 ? [...state.stack, target] : state.stack.filter((w, i) => i <= at || !isRoutable(w));
  if (target === 'project' && !stack.includes('projects')) stack = ['projects', ...stack];
  return { ...game, stack };
}

export function hashFor(state: State): string {
  if (state.view === 'resume' || state.view === 'play') return state.view;
  if (state.view === 'goodbye') return '';
  const routable = state.stack.filter(isRoutable);
  const top = routable[routable.length - 1];
  if (!top) return '';
  return top === 'project' && state.projectId ? `projects/${state.projectId}` : top;
}

// v2: sounds became on by default; the new key keeps earlier visits' saved "off" from overriding that.
const SETTINGS_KEY = 'cs-portfolio:settings:v2';
const DEFAULT_SETTINGS: Settings = { sound: true, theme: 'classic', playerName: 'Visitor', scene3d: true };

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    return raw ? { ...DEFAULT_SETTINGS, ...JSON.parse(raw) } : DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: Settings) {
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // Storage blocked (private mode etc.): settings just won't persist.
  }
}

export function initState(): State {
  const base: State = {
    view: 'game',
    stack: [],
    projectId: null,
    connecting: null,
    kills: [],
    killSeq: 0,
    settings: loadSettings(),
  };
  return applyHash(base, location.hash.slice(1));
}
