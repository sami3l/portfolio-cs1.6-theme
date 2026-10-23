import { Button, LinkButton } from '../components/vgui/Button';
import { portfolio } from '../data/portfolio';
import { useStore } from '../state/context';

export function Goodbye() {
  const { state, actions } = useStore();
  return (
    <main className="goodbye">
      <pre className="goodbye__log">
        {`Dropped ${state.settings.playerName} from server\nReason: Client sent 'drop'\n\nThanks for visiting ${portfolio.profile.name}'s portfolio.`}
      </pre>
      <div className="goodbye__actions">
        <Button onClick={() => actions.setView('game')} autoFocus>
          Reconnect
        </Button>
        <LinkButton href="#resume">Plain résumé</LinkButton>
      </div>
    </main>
  );
}
