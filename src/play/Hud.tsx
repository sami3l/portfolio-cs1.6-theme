import type { WeaponId } from './runtime';

/** CS-style bottom HUD: health and armor on the left, money and ammo on the right. */
export function Hud({ weapon, ammo, reserve, reloading }: { weapon: WeaponId; ammo: number; reserve: number; reloading: boolean }) {
  return (
    <div className="play__hud" aria-hidden="true">
      <div className="play__hud-left">
        <span className="play__stat">
          <span className="play__icon">✚</span> 100
        </span>
        <span className="play__stat">
          <span className="play__icon">⛨</span> 100
        </span>
      </div>
      <div className="play__hud-right">
        <span className="play__money">$ 16000</span>
        {weapon === 'rifle' ? (
          <span className="play__stat">
            {reloading ? '--' : ammo} <span className="play__sep">|</span> {reserve}
          </span>
        ) : (
          <span className="play__stat play__stat--dim">knife</span>
        )}
      </div>
    </div>
  );
}
