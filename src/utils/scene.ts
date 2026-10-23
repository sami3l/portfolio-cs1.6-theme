import { isMobile } from './format';

export interface SceneSupport {
  /** The 3D scene can run here. */
  available: boolean;
  /** Render one still frame: no camera drift or moving dust. */
  still: boolean;
  /** Why the flat scene is used, or why 3D is still; shown under the Options checkbox. */
  note?: string;
}

/** Decides once per page load whether the 3D menu scene can run, and how. */
export function sceneSupport(): SceneSupport {
  if (isMobile()) return { available: false, still: true, note: 'Phones use the flat scene to save battery.' };
  let webgl = false;
  try {
    const canvas = document.createElement('canvas');
    webgl = Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl'));
  } catch {
    webgl = false;
  }
  if (!webgl) {
    return {
      available: false,
      still: true,
      note: 'WebGL is turned off in this browser (often "Use graphics acceleration" in its settings), so the flat scene is used.',
    };
  }
  const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  return { available: true, still, note: still ? 'Reduced motion is on in your system, so the 3D scene stays still.' : undefined };
}
