import { defineConfig } from 'astro/config';
import preact from '@astrojs/preact';

// BENCH_BASE drives the deployment subpath (e.g. /web-content-generation-bench/astro-preact)
// for GitHub Pages. Empty by default so local builds keep using root-relative URLs.
const base = process.env.BENCH_BASE || undefined;

// https://astro.build/config
export default defineConfig({
  output: 'static',
  base,
  // `compat: true` makes the @astrojs/preact integration accept React-named
  // imports (useState, useEffect, etc.) via preact/compat. That lets the
  // CartIsland.tsx and SauceModal.tsx files be textually identical to the
  // astro-react versions; only the integration differs.
  integrations: [preact({ compat: true })],
});
