import type { Weapon } from '../state/context';

// Simple original silhouettes in the spirit of the kill-feed icons (not game assets).
const WEAPON_PATHS: Record<Weapon, string> = {
  rifle:
    'M2 7h4l2-1h22l1-2h3v2h10v2h-4v1h-9l-1 1h-5l-2 5h-4l1-5h-5l-1 3h-4l1-3H9L3 12H1z',
  sniper: 'M1 7h6l2-1h37v2H33l-2 1h-6l-2 5h-3l1-5H10l-8 3zM17 3h11v2H17z',
  pistol: 'M12 4h22v4H25l-1 1h-3l-2 6h-6l2-6h-3z',
  knife: 'M3 7h9v3H3zM12 6.5 L32 5 Q42 6 44 8.5 L32 10 L12 9.5z',
  grenade: 'M22 2h5v2h3v2h-3v1.2A6 6 0 1 1 22 7.2z',
};

export function WeaponIcon({ weapon, className }: { weapon: Weapon; className?: string }) {
  return (
    <svg viewBox="0 0 48 16" className={className} width="48" height="16" aria-hidden="true">
      <path d={WEAPON_PATHS[weapon]} fill="currentColor" />
    </svg>
  );
}

export function HeadshotIcon() {
  return (
    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
      <circle cx="8" cy="8" r="5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 0v5M8 11v5M0 8h5M11 8h5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

export function LockIcon({ title }: { title?: string }) {
  return (
    <svg viewBox="0 0 12 14" width="10" height="12" role={title ? 'img' : undefined} aria-hidden={title ? undefined : true}>
      {title && <title>{title}</title>}
      <path d="M3 6V4a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <rect x="1" y="6" width="10" height="7" fill="currentColor" />
    </svg>
  );
}
