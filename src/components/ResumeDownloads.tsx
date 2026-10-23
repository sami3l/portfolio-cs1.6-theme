import { portfolio } from '../data/portfolio';
import { useStore } from '../state/context';
import { asset } from '../utils/format';
import { LinkButton } from './vgui/Button';

/** One download button per résumé language (EN / FR). */
export function ResumeDownloads({ className = '' }: { className?: string }) {
  const { state, actions } = useStore();
  return (
    <>
      {portfolio.contact.resumes.map((r) => (
        <LinkButton
          key={r.lang}
          href={asset(r.href)}
          download={r.filename}
          className={className}
          aria-label={`Download CV (${r.label}, PDF)`}
          onClick={() =>
            actions.kill({ killer: state.settings.playerName, weapon: 'sniper', victim: `CV_${r.lang}.pdf`, headshot: true })
          }
        >
          CV · {r.lang} ↓
        </LinkButton>
      ))}
    </>
  );
}
