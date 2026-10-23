import { Button, LinkButton } from '../components/vgui/Button';
import { Window } from '../components/vgui/Window';
import { portfolio } from '../data/portfolio';
import { useStore } from '../state/context';
import { mapName } from '../utils/format';
import { screenshotsFor } from '../utils/screenshots';

/** Details of one project, presented as the "Server Info" dialog. */
export function ServerInfoDialog() {
  const { state, actions } = useStore();
  const project = portfolio.projects.find((p) => p.id === state.projectId);
  if (!project) return null;
  const shots = screenshotsFor(project);

  return (
    <Window
      id="project"
      title={`Server Info · ${project.name}`}
      width={600}
      height={620}
      footer={
        <>
          {project.live ? <LinkButton href={project.live}>Join game</LinkButton> : <Button disabled>Join game</Button>}
          {project.repo ? (
            <LinkButton href={project.repo}>View source</LinkButton>
          ) : (
            <Button disabled title="Private repository">
              View source
            </Button>
          )}
          <Button onClick={() => actions.close('project')}>Close</Button>
        </>
      }
    >
      <dl className="info-grid">
        <dt>Name</dt>
        <dd>{project.name}</dd>
        <dt>Map</dt>
        <dd>{mapName(project)}</dd>
        <dt>Game</dt>
        <dd>
          {project.role}
          {project.org && ` · ${project.org}`}
        </dd>
        {project.teamSize && (
          <>
            <dt>Players</dt>
            <dd>{project.teamSize}</dd>
          </>
        )}
        {project.year && (
          <>
            <dt>Year</dt>
            <dd>{project.year}</dd>
          </>
        )}
      </dl>
      <div className="vgui-inset info-desc">
        {project.description.map((p) => (
          <p key={p}>{p}</p>
        ))}
      </div>
      <h3 className="section-label">Stack</h3>
      <ul className="chips">
        {project.stack.map((s) => (
          <li key={s} className="chip">
            {s}
          </li>
        ))}
      </ul>
      {shots.length > 0 && (
        <>
          <h3 className="section-label">Screenshots</h3>
          <div className="info-shots">
            {shots.map((src, i) => (
              <a key={src} href={src} target="_blank" rel="noreferrer">
                <img src={src} alt={`${project.name} screenshot ${i + 1}`} loading="lazy" />
              </a>
            ))}
          </div>
        </>
      )}
    </Window>
  );
}
