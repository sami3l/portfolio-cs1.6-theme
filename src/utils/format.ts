import type { Experience, Project } from '../data/types';

/** "React" → "de_react", the CS map-name joke used in the server browser. */
export const mapName = (project: Project) =>
  `de_${(project.stack[0] ?? 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '')}`;

function formatDate(value: string) {
  const [year, month] = value.split('-').map(Number);
  if (!month) return String(year);
  return new Date(year, month - 1).toLocaleString('en', { month: 'short', year: 'numeric' });
}

export const formatPeriod = (e: Pick<Experience, 'start' | 'end'>) =>
  `${formatDate(e.start)} – ${e.end ? formatDate(e.end) : 'Present'}`;

/** "https://github.com/foo" → "github.com/foo" */
export const prettyUrl = (url: string) => url.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');

export const isTyping = (target: EventTarget | null) =>
  target instanceof HTMLElement &&
  (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

export const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

/** Resolves a file in /public against the deploy base path (works on GitHub Pages sub-paths too). */
export const asset = (path: string) => import.meta.env.BASE_URL + path.replace(/^\//, '');

/** Projects whose stack mentions the skill, e.g. "Kubernetes" → the GitOps platform. */
export const projectsUsing = <P extends { stack: string[] }>(projects: P[], skill: string) => {
  const key = skill.toLowerCase().split(/\s*\/\s*/)[0];
  return projects.filter((p) => p.stack.some((s) => s.toLowerCase().includes(key)));
};
