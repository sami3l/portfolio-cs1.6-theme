const SEEN_KEY = 'cs-portfolio:loaded';

/** First visit of the session only, so repeat navigation stays instant. */
export function shouldShowLoading() {
  try {
    return !sessionStorage.getItem(SEEN_KEY);
  } catch {
    return true; // Storage blocked: show it every time; it is short and skippable.
  }
}

export function markSeen() {
  try {
    sessionStorage.setItem(SEEN_KEY, '1');
  } catch {
    // Storage blocked: nothing to remember.
  }
}
