import { useEffect, useMemo, useReducer, type ReactNode } from 'react';
import { setSoundEnabled } from '../audio/sfx';
import { useHashSync } from '../hooks/useHashSync';
import { StoreContext, type Actions } from './context';
import { initState, reducer, saveSettings } from './reducer';

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, initState);

  const actions = useMemo<Actions>(
    () => ({
      open: (id) => dispatch({ type: 'open', id }),
      close: (id) => dispatch({ type: 'close', id }),
      toggle: (id) => dispatch({ type: 'toggle', id }),
      closeTop: () => dispatch({ type: 'closeTop' }),
      openProject: (projectId) => dispatch({ type: 'openProject', projectId }),
      kill: ({ team = 'ct', ...kill }) => dispatch({ type: 'kill', kill: { ...kill, team } }),
      expireKill: (id) => dispatch({ type: 'expireKill', id }),
      setSettings: (patch) => dispatch({ type: 'settings', patch }),
      setView: (view) => dispatch({ type: 'view', view }),
      syncHash: (hash) => dispatch({ type: 'syncHash', hash }),
    }),
    [],
  );

  useEffect(() => {
    saveSettings(state.settings);
    setSoundEnabled(state.settings.sound);
  }, [state.settings]);

  useEffect(() => {
    document.documentElement.dataset.theme = state.settings.theme;
  }, [state.settings.theme]);

  useHashSync(state, actions.syncHash);

  const value = useMemo(() => ({ state, actions }), [state, actions]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}
