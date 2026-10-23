import { portfolio } from '../data/portfolio';
import { asset } from '../utils/format';

/** Profile photo, or Steam-style initials when no avatar is set. */
export function Avatar({ size = 84 }: { size?: number }) {
  const { name, avatar } = portfolio.profile;
  if (avatar) return <img className="avatar" src={asset(avatar)} alt={name} width={size} height={size} />;
  const initials = name
    .split(/\s+/)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
  return (
    <div className="avatar avatar--initials" style={{ width: size, height: size }} aria-hidden="true">
      {initials}
    </div>
  );
}
