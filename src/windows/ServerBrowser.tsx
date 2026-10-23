import { useState, type KeyboardEvent } from 'react';
import { LockIcon } from '../components/Icons';
import { Button } from '../components/vgui/Button';
import { Tabs } from '../components/vgui/Tabs';
import { Window } from '../components/vgui/Window';
import { portfolio } from '../data/portfolio';
import type { Project } from '../data/types';
import { useStore } from '../state/context';
import { mapName } from '../utils/format';

type Filter = 'all' | 'featured' | Project['category'];

const TABS: { id: Filter; label: string }[] = [
  { id: 'all', label: 'Internet' },
  { id: 'featured', label: 'Favorites' },
  { id: 'work', label: 'Work' },
  { id: 'academic', label: 'Academic' },
  { id: 'side', label: 'Side' },
];

const matchesFilter = (p: Project, filter: Filter) =>
  filter === 'all' || (filter === 'featured' ? p.featured : p.category === filter);

const matchesQuery = (p: Project, query: string) => {
  const q = query.trim().toLowerCase();
  return !q || [p.name, p.summary, p.role, p.org ?? '', ...p.stack].some((s) => s.toLowerCase().includes(q));
};

/** Projects, presented as the Find Servers dialog. Click a selected row (or double-click) to connect. */
export function ServerBrowser() {
  const { state, actions } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<string | null>(state.projectId);
  const [refreshing, setRefreshing] = useState(false);

  const rows = portfolio.projects.filter((p) => matchesFilter(p, filter) && matchesQuery(p, query));

  const refresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
      actions.kill({ killer: state.settings.playerName, weapon: 'grenade', victim: 'stale server list' });
    }, 700);
  };

  const onRowKeyDown = (e: KeyboardEvent<HTMLTableRowElement>, project: Project) => {
    if (e.key === 'Enter') actions.connect(project.id);
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      const next = e.key === 'ArrowDown' ? e.currentTarget.nextElementSibling : e.currentTarget.previousElementSibling;
      (next as HTMLElement | null)?.focus();
    }
  };

  return (
    <Window
      id="projects"
      title="Servers"
      width={820}
      height={540}
      footer={
        <>
          <span className="vgui-footer__status">
            {refreshing ? 'Refreshing…' : `${rows.length} of ${portfolio.projects.length} servers`}
          </span>
          <Button onClick={refresh} disabled={refreshing}>
            Refresh
          </Button>
          <Button onClick={() => selected && actions.connect(selected)} disabled={!selected}>
            Connect
          </Button>
        </>
      }
    >
      <Tabs idPrefix="servers" tabs={TABS} active={filter} onChange={setFilter}>
        <label className="servers__filter">
          <span>Filter</span>
          <input
            type="search"
            className="vgui-input"
            placeholder="name, stack, company…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="servers vgui-inset">
          <table className="vgui-table">
            <thead>
              <tr>
                <th className="col-icon">
                  <span className="sr-only">Access</span>
                </th>
                <th>Servers</th>
                <th className="col-game">Game</th>
                <th>Map</th>
                <th className="col-year">Year</th>
              </tr>
            </thead>
            <tbody>
              {refreshing || rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="servers__empty">
                    {refreshing ? 'Refreshing server list…' : 'No servers respond to that filter.'}
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr
                    key={p.id}
                    tabIndex={0}
                    aria-selected={selected === p.id}
                    onClick={() => (selected === p.id ? actions.connect(p.id) : setSelected(p.id))}
                    onFocus={() => setSelected(p.id)}
                    onKeyDown={(e) => onRowKeyDown(e, p)}
                  >
                    <td className="col-icon">{!p.repo && !p.live && <LockIcon title="Private: no public link" />}</td>
                    <td>
                      <span className="servers__name">
                        {p.featured && <span className="servers__star" aria-label="Favorite">★ </span>}
                        {p.name}
                      </span>
                      <span className="servers__summary">{p.summary}</span>
                    </td>
                    <td className="col-game">{p.org ?? p.role}</td>
                    <td title={p.stack.join(', ')}>{mapName(p)}</td>
                    <td className="col-year">{p.year ?? '—'}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Tabs>
    </Window>
  );
}
