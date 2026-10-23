import { useState } from 'react';
import { ResumeDownloads } from '../components/ResumeDownloads';
import { Button, LinkButton } from '../components/vgui/Button';
import { Tabs } from '../components/vgui/Tabs';
import { Window } from '../components/vgui/Window';
import { portfolio } from '../data/portfolio';
import { useStore, type Settings } from '../state/context';
import { prettyUrl } from '../utils/format';

type Tab = 'contact' | 'multiplayer' | 'audio';

const TABS: { id: Tab; label: string }[] = [
  { id: 'contact', label: 'Contact' },
  { id: 'multiplayer', label: 'Multiplayer' },
  { id: 'audio', label: 'Audio / Video' },
];

/** Contact details plus a few real settings, presented as the Options dialog. */
export function OptionsWindow() {
  const { state, actions } = useStore();
  const [tab, setTab] = useState<Tab>('contact');
  const [status, setStatus] = useState('');
  const { contact } = portfolio;

  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(contact.email);
      setStatus('E-mail address copied to the clipboard.');
      actions.kill({ killer: state.settings.playerName, weapon: 'knife', victim: 'awkward silence' });
    } catch {
      setStatus('Could not copy. Select the address instead.');
    }
  };

  const links = [
    { label: 'GitHub', url: contact.github },
    { label: 'LinkedIn', url: contact.linkedin },
    { label: 'Website', url: contact.website },
  ].filter((l): l is { label: string; url: string } => Boolean(l.url));

  return (
    <Window
      id="options"
      title="Options"
      width={580}
      height={500}
      footer={
        <>
          <span className="vgui-footer__status" role="status">
            {status}
          </span>
          <Button onClick={() => actions.close('options')}>OK</Button>
        </>
      }
    >
      <Tabs idPrefix="options" tabs={TABS} active={tab} onChange={setTab}>
        {tab === 'contact' && (
          <>
            <dl className="contact">
              <dt>E-mail</dt>
              <dd>
                <a href={`mailto:${contact.email}`}>{contact.email}</a>
                <Button onClick={copyEmail}>Copy</Button>
              </dd>
              {contact.phone && (
                <>
                  <dt>Phone</dt>
                  <dd>
                    <a href={`tel:${contact.phone.replace(/[^+\d]/g, '')}`}>{contact.phone}</a>
                  </dd>
                </>
              )}
              {links.map((l) => (
                <LinkRow key={l.label} label={l.label} url={l.url} />
              ))}
              <dt>Location</dt>
              <dd>{portfolio.profile.location}</dd>
            </dl>
            <h3 className="section-label">Résumé</h3>
            <div className="contact__cta">
              <ResumeDownloads />
              <LinkButton href="#resume">Read online</LinkButton>
            </div>
          </>
        )}

        {tab === 'multiplayer' && (
          <div className="form-rows">
            <label className="form-row">
              <span>Player name</span>
              <input
                className="vgui-input"
                maxLength={24}
                value={state.settings.playerName}
                onChange={(e) => actions.setSettings({ playerName: e.target.value })}
              />
            </label>
            <p className="hint">Your name shows up in the kill feed and among the scoreboard's spectators. It stays in this browser.</p>
          </div>
        )}

        {tab === 'audio' && (
          <div className="form-rows">
            <label className="form-row form-row--inline">
              <input
                type="checkbox"
                checked={state.settings.sound}
                onChange={(e) => actions.setSettings({ sound: e.target.checked })}
              />
              <span>Enable UI sounds</span>
            </label>
            <label className="form-row">
              <span>Theme</span>
              <select
                className="vgui-input"
                value={state.settings.theme}
                onChange={(e) => actions.setSettings({ theme: e.target.value as Settings['theme'] })}
              >
                <option value="classic">Classic (VGUI green)</option>
                <option value="dark">Dark</option>
              </select>
            </label>
            <p className="hint">Animations follow your system's reduced-motion setting.</p>
          </div>
        )}
      </Tabs>
    </Window>
  );
}

function LinkRow({ label, url }: { label: string; url: string }) {
  return (
    <>
      <dt>{label}</dt>
      <dd>
        <a href={url} target="_blank" rel="noreferrer">
          {prettyUrl(url)}
        </a>
      </dd>
    </>
  );
}
