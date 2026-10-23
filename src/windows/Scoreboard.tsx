import { Fragment, useState } from 'react';
import { Window } from '../components/vgui/Window';
import { portfolio } from '../data/portfolio';
import { useStore } from '../state/context';
import { formatPeriod } from '../utils/format';

const TEAMS = [
  { team: 'ct', label: 'Counter-Terrorists', sub: 'Work experience' },
  { team: 't', label: 'Terrorists', sub: 'Education' },
] as const;

/** Experience and education, presented as the TAB scoreboard. Click a row for details. */
export function Scoreboard() {
  const { state } = useStore();
  const [open, setOpen] = useState<string | null>(portfolio.experience[0]?.id ?? null);
  const { profile } = portfolio;

  return (
    <Window id="scoreboard" title={`${profile.nickname}'s career · de_career`} width={800} height={600} className="window--hud">
      {TEAMS.map(({ team, label, sub }) => {
        const rows = portfolio.experience.filter((e) => e.team === team);
        return (
          <section key={team} className={`score score--${team}`} aria-label={`${label}: ${sub}`}>
            <h3 className="score__team">
              <span>{label}</span>
              <small>{sub}</small>
              <span className="score__count">
                {rows.length} {rows.length === 1 ? 'player' : 'players'}
              </span>
            </h3>
            <table className="score__table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th className="col-org">Organization</th>
                  <th>Period</th>
                  <th className="num" title="Highlights">
                    Score
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <Fragment key={r.id}>
                    <tr className={open === r.id ? 'is-open' : ''}>
                      <td>
                        <button
                          type="button"
                          className="score__toggle"
                          aria-expanded={open === r.id}
                          onClick={() => setOpen(open === r.id ? null : r.id)}
                        >
                          {r.title}
                          <span className="score__org-inline">{r.org}</span>
                        </button>
                      </td>
                      <td className="col-org">{r.org}</td>
                      <td className="nowrap">{formatPeriod(r)}</td>
                      <td className="num">{r.highlights.length}</td>
                    </tr>
                    {open === r.id && (
                      <tr className="score__details">
                        <td colSpan={4}>
                          <ul>
                            {r.highlights.map((h) => (
                              <li key={h}>{h}</li>
                            ))}
                          </ul>
                          {r.stack && <p className="score__stack">{r.stack.join(' · ')}</p>}
                        </td>
                      </tr>
                    )}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </section>
        );
      })}

      <section className="score score--spec" aria-label="Certifications">
        <h3 className="score__team">
          <span>Certifications</span>
        </h3>
        <ul className="score__certs">
          {profile.certifications.map((c) => (
            <li key={c.name}>
              {c.name}
              {c.issuer && <span className="score__issuer"> · {c.issuer}</span>}
              {c.inProgress && <span className="score__badge">in progress</span>}
            </li>
          ))}
        </ul>
      </section>

      <p className="score__spectators">Spectators: {state.settings.playerName}</p>
    </Window>
  );
}
