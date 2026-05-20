import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { AppConfig } from './types';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..', '..');

const app = (id: string, label: string, workspace: string, outRel: string): AppConfig => {
  const appDir = resolve(repoRoot, 'apps', id);
  return { id, label, workspace, appDir, outDir: resolve(appDir, outRel) };
};

export const APPS: AppConfig[] = [
  app('eleventy-react', 'Eleventy + React', '@bench/app-eleventy-react', '_site'),
  app('eleventy-preact', 'Eleventy + Preact', '@bench/app-eleventy-preact', '_site'),
  app('astro-react', 'Astro + React', '@bench/app-astro-react', 'dist'),
  app('astro-preact', 'Astro + Preact', '@bench/app-astro-preact', 'dist'),
  app('nextjs', 'Next.js', '@bench/app-nextjs', 'out'),
  app('sveltekit', 'SvelteKit', '@bench/app-sveltekit', 'build'),
];

/**
 * Picks the canonical "first restaurant" HTML for each app. Slug filename
 * conventions differ (Next puts `<slug>.html` at root, others use
 * `<slug>/index.html`), so we accept either.
 */
export const findSampleHtml = (outDir: string, slug: string): string => {
  return resolve(outDir, slug, 'index.html');
};

export const REPO_ROOT = repoRoot;
