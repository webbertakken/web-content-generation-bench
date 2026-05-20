#!/usr/bin/env node
/**
 * Copies Pie's design-token stylesheet from node_modules into each app's
 * static asset folder so menu.css can `@import './pie-tokens.css';` without
 * needing each framework's CSS bundler to resolve npm specifiers.
 *
 * Runs on root `postinstall`, idempotent.
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

const src = resolve(repoRoot, 'node_modules', '@justeattakeaway', 'pie-css', 'dist', 'index.css');

if (!existsSync(src)) {
  console.warn(`[sync-pie-tokens] source missing at ${src}; skipping. Did you run "yarn install"?`);
  process.exit(0);
}

// Each entry: the static directory whose <root>/styles/pie-tokens.css the
// framework will ship. Apps that bundle CSS via Vite/Next still get a
// duplicate placed next to menu.css so the @import works the same way.
const destinations = [
  'apps/eleventy-react/src/styles/pie-tokens.css',
  'apps/eleventy-preact/src/styles/pie-tokens.css',
  'apps/astro-react/public/styles/pie-tokens.css',
  'apps/astro-preact/public/styles/pie-tokens.css',
  'apps/nextjs/app/pie-tokens.css',
  'apps/sveltekit/static/styles/pie-tokens.css',
];

for (const rel of destinations) {
  const dest = resolve(repoRoot, rel);
  mkdirSync(dirname(dest), { recursive: true });
  copyFileSync(src, dest);
  console.log(`[sync-pie-tokens] -> ${rel}`);
}
