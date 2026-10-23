import { sfx } from '../audio/sfx';
import { portfolio } from '../data/portfolio';
import { useStore, type WindowId } from '../state/context';

const ITEMS: { label: string; hint: string; window: WindowId | 'play' }[] = [
  { label: 'Play', hint: 'Walk the map', window: 'play' },
  { label: 'New Game', hint: 'About me', window: 'about' },
  { label: 'Find Servers', hint: 'Projects', window: 'projects' },
  { label: 'Buy Menu', hint: 'Skills', window: 'skills' },
  { label: 'Scoreboard', hint: 'Experience', window: 'scoreboard' },
  { label: 'Options', hint: 'Contact', window: 'options' },
  { label: 'Console', hint: 'Commands', window: 'console' },
  { label: 'Quit', hint: '', window: 'quit' },
];

export function MainMenu() {
  const { actions } = useStore();
  const { profile } = portfolio;

  return (
    <nav className="menu" aria-label="Main menu">
      <div className="logo">
        <h1 className="logo__name">{profile.name}</h1>
        <p className="logo__tagline">{profile.tagline}</p>
      </div>
      <ul className="menu__list">
        {ITEMS.map((item) => (
          <li key={item.window}>
            <button
              type="button"
              className="menu__item"
              onMouseEnter={sfx.hover}
              onClick={() => {
                sfx.click();
                if (item.window === 'play') actions.setView('play');
                else actions.open(item.window);
              }}
            >
              <span>{item.label}</span>
              {item.hint && <span className="menu__hint">{item.hint}</span>}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
