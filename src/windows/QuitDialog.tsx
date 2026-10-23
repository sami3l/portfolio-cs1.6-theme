import { Button } from '../components/vgui/Button';
import { Window } from '../components/vgui/Window';
import { useStore } from '../state/context';

export function QuitDialog() {
  const { actions } = useStore();
  return (
    <Window
      id="quit"
      title="Quit"
      width={380}
      height={170}
      footer={
        <>
          <Button onClick={() => actions.setView('goodbye')}>Quit game</Button>
          <Button onClick={() => actions.close('quit')}>Cancel</Button>
        </>
      }
    >
      <p>Are you sure you want to quit?</p>
    </Window>
  );
}
