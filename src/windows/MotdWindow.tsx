import { sfx } from '../audio/sfx';
import { Avatar } from '../components/Avatar';
import { ResumeDownloads } from '../components/ResumeDownloads';
import { Button } from '../components/vgui/Button';
import { Window } from '../components/vgui/Window';
import { portfolio } from '../data/portfolio';
import { useWindowKeys } from '../hooks/useWindowKeys';
import { useStore, type WindowId } from '../state/context';

/** "About me", presented as the server's message of the day followed by the team-select screen. */
export function MotdWindow() {
  const { actions } = useStore();
  const { profile } = portfolio;

  const pick = (id: WindowId) => {
    actions.close('about');
    actions.open(id);
  };

  const teams = [
    { key: '1', team: 'ct', name: 'Recruiters', blurb: 'Browse my projects', go: () => pick('projects') },
    { key: '2', team: 't', name: 'Collaborators', blurb: 'Get in touch', go: () => pick('options') },
    { key: '5', team: 'auto', name: 'Auto-select', blurb: 'Let fate decide', go: () => pick(Math.random() < 0.5 ? 'projects' : 'skills') },
    { key: '6', team: 'spec', name: 'Spectate', blurb: 'Read my career log', go: () => pick('scoreboard') },
  ];

  useWindowKeys('about', (e) => {
    const team = teams.find((t) => t.key === e.key);
    if (!team) return;
    e.preventDefault();
    sfx.click();
    team.go();
  });

  return (
    <Window
      id="about"
      title={`Message of the Day · ${profile.nickname}`}
      width={660}
      height={640}
      footer={
        <>
          <ResumeDownloads />
          <Button onClick={() => actions.close('about')}>OK</Button>
        </>
      }
    >
      <article className="motd vgui-inset">
        <header className="motd__head">
          <Avatar />
          <div>
            <h3 className="motd__name">{profile.name}</h3>
            <p className="motd__title">{profile.title}</p>
            <p className="motd__meta">{profile.location}</p>
          </div>
        </header>
        {profile.bio.map((p) => (
          <p key={p}>{p}</p>
        ))}
        <dl className="motd__facts">
          <dt>Languages</dt>
          <dd>{profile.languages.map((l) => `${l.name} (${l.level})`).join(' · ')}</dd>
          <dt>Interests</dt>
          <dd>{profile.interests.join(' · ')}</dd>
        </dl>
      </article>

      <h3 className="section-label">Choose a team</h3>
      <div className="teams">
        {teams.map((t) => (
          <button
            key={t.key}
            type="button"
            className={`team team--${t.team}`}
            onClick={() => {
              sfx.click();
              t.go();
            }}
          >
            <span className="team__key">{t.key}</span>
            <span className="team__name">{t.name}</span>
            <span className="team__blurb">{t.blurb}</span>
          </button>
        ))}
      </div>
    </Window>
  );
}
