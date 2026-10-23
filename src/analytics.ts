// Thin wrapper around GoatCounter (loaded async in index.html). Every call is a no-op when the
// script is blocked (ad blockers) or on localhost, so the site never depends on it.

interface GoatCounter {
  count: (vars: { path: string; title?: string; event?: boolean }) => void;
}

declare global {
  interface Window {
    goatcounter?: GoatCounter;
  }
}

function send(vars: Parameters<GoatCounter['count']>[0]) {
  if (window.goatcounter?.count) {
    window.goatcounter.count(vars);
    return;
  }
  // Script still loading: send once it arrives.
  document.getElementById('goatcounter')?.addEventListener('load', () => window.goatcounter?.count?.(vars), { once: true });
}

/** A page view. Windows count as pages: "#projects/stratospend" → "/portfolio-cs1.6-theme/#projects/stratospend". */
export function trackView(hash: string, title: string) {
  send({ path: location.pathname + (hash ? `#${hash}` : ''), title });
}

/** A one-off action, e.g. "download: Sami-Elhadraoui-CV-EN.pdf" or "outbound: github.com/sami3l/stratospend". */
export function trackEvent(name: string, title = name) {
  send({ path: name, title, event: true });
}

const VIEW_TITLES: Record<string, string> = {
  '': 'Main menu',
  about: 'About',
  projects: 'Projects',
  skills: 'Skills',
  scoreboard: 'Experience',
  options: 'Contact',
  resume: 'Résumé',
  play: 'Play mode',
};

export function titleForHash(hash: string, projectName?: string) {
  if (hash.startsWith('projects/')) return `Project: ${projectName ?? hash.slice(9)}`;
  return VIEW_TITLES[hash] ?? hash;
}

/**
 * One document-level listener for links anywhere on the page: CV downloads, outbound links
 * (GitHub, LinkedIn, live demos) and mailto clicks.
 */
export function initLinkTracking() {
  document.addEventListener('click', (e) => {
    const a = e.target instanceof Element ? e.target.closest('a[href]') : null;
    if (!(a instanceof HTMLAnchorElement)) return;
    if (a.hasAttribute('download')) trackEvent(`download: ${a.getAttribute('download') || a.pathname.split('/').pop()}`);
    else if (a.protocol === 'mailto:') trackEvent('email-click', 'E-mail link clicked');
    else if (a.host && a.host !== location.host) trackEvent(`outbound: ${a.host}${a.pathname.replace(/\/$/, '')}`);
  });
}
