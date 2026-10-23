import { useEffect } from 'react';
import { HeadshotIcon, WeaponIcon } from '../components/Icons';
import { useStore, type Kill, type Weapon } from '../state/context';

const LIFETIME_MS = 6000;

const WEAPON_NAMES: Record<Weapon, string> = {
  rifle: 'rifle',
  sniper: 'sniper rifle',
  pistol: 'pistol',
  knife: 'knife',
  grenade: 'grenade',
};

export function KillFeed() {
  const { state } = useStore();
  return (
    <div className="killfeed" role="status" aria-live="polite">
      {state.kills.map((kill) => (
        <KillRow key={kill.id} kill={kill} />
      ))}
    </div>
  );
}

function KillRow({ kill }: { kill: Kill }) {
  const { actions } = useStore();

  useEffect(() => {
    const timer = setTimeout(() => actions.expireKill(kill.id), LIFETIME_MS);
    return () => clearTimeout(timer);
  }, [actions, kill.id]);

  const victimTeam = kill.team === 'ct' ? 't' : 'ct';
  return (
    <div className="kill">
      <span aria-hidden="true" className={`kill__name kill__name--${kill.team}`}>
        {kill.killer}
      </span>
      <WeaponIcon weapon={kill.weapon} className="kill__weapon" />
      {kill.headshot && <HeadshotIcon />}
      <span aria-hidden="true" className={`kill__name kill__name--${victimTeam}`}>
        {kill.victim}
      </span>
      <span className="sr-only">
        {kill.killer} killed {kill.victim} with a {WEAPON_NAMES[kill.weapon]}
        {kill.headshot ? ' (headshot)' : ''}
      </span>
    </div>
  );
}
