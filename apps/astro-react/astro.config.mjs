import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// BENCH_BASE drives the deployment subpath (e.g. /web-content-generation-bench/astro-react)
// for GitHub Pages. Empty by default so local builds keep using root-relative URLs.
const base = process.env.BENCH_BASE || undefined;

// https://astro.build/config
export default defineConfig({
  output: 'static',
  base,
  integrations: [react()],
  vite: {
    // Pie web components self-register; we let them be imported in the React
    // island and rely on Vite's tree-shaking. Nothing extra needed here.
  },
});
