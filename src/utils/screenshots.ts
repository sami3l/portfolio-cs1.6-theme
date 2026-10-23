import type { Project } from '../data/types';
import { asset } from './format';

// Every image in src/assets/projects/<project-id>/ is bundled automatically, sorted by file name.
const files = import.meta.glob<string>('../assets/projects/*/*.{png,jpg,jpeg,webp,gif,avif}', {
  eager: true,
  query: '?url',
  import: 'default',
});

const byProject = new Map<string, string[]>();
for (const path of Object.keys(files).sort()) {
  const parts = path.split('/');
  const id = parts[parts.length - 2];
  byProject.set(id, [...(byProject.get(id) ?? []), files[path]]);
}

/** Screenshots dropped into the project's assets folder, plus any listed in the data file's `images`. */
export const screenshotsFor = (project: Project) => [
  ...(byProject.get(project.id) ?? []),
  ...(project.images ?? []).map(asset),
];
