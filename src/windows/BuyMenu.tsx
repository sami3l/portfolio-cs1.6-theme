import { useState } from 'react';
import { sfx } from '../audio/sfx';
import { WeaponIcon } from '../components/Icons';
import { Button } from '../components/vgui/Button';
import { Window } from '../components/vgui/Window';
import { portfolio } from '../data/portfolio';
import type { Skill } from '../data/types';
import { useWindowKeys } from '../hooks/useWindowKeys';
import { useStore, type Weapon } from '../state/context';
import { projectsUsing } from '../utils/format';

const SLOT_WEAPONS: Weapon[] = ['pistol', 'rifle', 'rifle', 'rifle', 'sniper', 'grenade', 'knife'];
const LEVELS = ['', 'Novice', 'Familiar', 'Proficient', 'Advanced', 'Expert'];

/** Where a skill shows up: projects plus internships, from the stacks in the data file. */
function usedIn(skill: Skill) {
  const projects = projectsUsing(portfolio.projects, skill.name).map((p) => p.name);
  const jobs = projectsUsing(
    portfolio.experience.map((e) => ({ ...e, stack: e.stack ?? [] })),
    skill.name,
  ).map((e) => e.org);
  return [...new Set([...projects, ...jobs])];
}

/**
 * Skills, presented as the buy menu. Like the game: a number picks a category,
 * then a number picks an item, 0 goes back or closes.
 */
export function BuyMenu() {
  const { actions } = useStore();
  const categories = portfolio.skills;
  const [catIdx, setCatIdx] = useState(0);
  const [itemIdx, setItemIdx] = useState(0);
  const [stage, setStage] = useState<'category' | 'item'>('category');
  const [status, setStatus] = useState('');

  const category = categories[catIdx];
  const skill = category.skills[itemIdx] ?? category.skills[0];
  const weapon = SLOT_WEAPONS[catIdx] ?? 'rifle';
  const uses = usedIn(skill);

  const chooseCategory = (i: number) => {
    setCatIdx(i);
    setItemIdx(0);
    setStage('item');
  };

  const buy = () => {
    sfx.buy();
    setStatus(`Purchased: ${skill.name}`);
  };

  useWindowKeys('skills', (e) => {
    if (!/^[0-9]$/.test(e.key)) return;
    e.preventDefault();
    const n = Number(e.key);
    sfx.click();
    if (n === 0) {
      if (stage === 'item') setStage('category');
      else actions.close('skills');
    } else if (stage === 'category' && n <= categories.length) {
      chooseCategory(n - 1);
    } else if (stage === 'item' && n <= category.skills.length) {
      setItemIdx(n - 1);
    }
  });

  return (
    <Window
      id="skills"
      title="Buy Menu"
      width={860}
      height={560}
      footer={
        <>
          <span className="vgui-footer__status" role="status">
            {status || 'Press a number to pick a category, then an item. 0 goes back.'}
          </span>
          <Button onClick={() => actions.close('skills')}>Close</Button>
        </>
      }
    >
      <div className="buy">
        <section className="buy__col" data-active={stage === 'category'} aria-label="Categories">
          <h3 className="section-label">Categories</h3>
          <ol className="buy__list">
            {categories.map((c, i) => (
              <li key={c.slot}>
                <button type="button" className="buy__item" aria-pressed={i === catIdx} onClick={() => { sfx.click(); chooseCategory(i); }}>
                  <span className="buy__key">{i + 1}</span>
                  <span className="buy__label">
                    {c.label}
                    <small>{c.slot}</small>
                  </span>
                </button>
              </li>
            ))}
            <li>
              <button type="button" className="buy__item" onClick={() => actions.close('skills')}>
                <span className="buy__key">0</span>
                <span className="buy__label">Exit</span>
              </button>
            </li>
          </ol>
        </section>

        <section className="buy__col" data-active={stage === 'item'} aria-label={category.label}>
          <h3 className="section-label">{category.label}</h3>
          <ol className="buy__list">
            {category.skills.map((s, i) => (
              <li key={s.name}>
                <button
                  type="button"
                  className="buy__item"
                  aria-pressed={s === skill}
                  onClick={() => {
                    sfx.click();
                    setItemIdx(i);
                    setStage('item');
                  }}
                >
                  <span className="buy__key">{i + 1}</span>
                  <span className="buy__label">{s.name}</span>
                </button>
              </li>
            ))}
          </ol>
        </section>

        <section className="buy__detail vgui-inset" aria-live="polite">
          <WeaponIcon weapon={weapon} className="buy__art" />
          <h3 className="buy__name">{skill.name}</h3>
          <p className="buy__slot">
            {category.slot} · {category.label}
          </p>
          {skill.level && <Stat label="Proficiency" value={skill.level / 5} text={LEVELS[skill.level]} />}
          <Stat label="Field use" value={Math.min(1, uses.length / 4)} text={`${uses.length} ${uses.length === 1 ? 'place' : 'places'}`} />
          {skill.note && <p>{skill.note}</p>}
          {uses.length > 0 && (
            <>
              <h4 className="section-label">Used in</h4>
              <ul className="buy__uses">
                {uses.map((u) => (
                  <li key={u}>{u}</li>
                ))}
              </ul>
            </>
          )}
          <Button onClick={buy}>Buy</Button>
        </section>
      </div>
    </Window>
  );
}

function Stat({ label, value, text }: { label: string; value: number; text: string }) {
  return (
    <div className="stat">
      <span className="stat__label">{label}</span>
      <span className="stat__bar" role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value * 100)} aria-valuetext={text}>
        <span style={{ width: `${Math.round(value * 100)}%` }} />
      </span>
      <span className="stat__text">{text}</span>
    </div>
  );
}
