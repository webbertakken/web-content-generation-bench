import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

// BENCH_BASE drives the deployment subpath (e.g. /web-content-generation-bench/sveltekit)
// for GitHub Pages. Empty by default so local builds keep using root-relative URLs.
const base = (process.env.BENCH_BASE ?? '').replace(/\/$/, '');

/** @type {import('@sveltejs/kit').Config} */
const config = {
  preprocess: vitePreprocess(),
  kit: {
    adapter: adapter({
      pages: 'build',
      assets: 'build',
      fallback: undefined,
      precompress: false,
      strict: true,
    }),
    paths: base ? { base } : {},
    prerender: {
      handleHttpError: 'warn',
    },
  },
  // Pie elements are custom elements; Svelte's tag-name detection sees the
  // hyphen and treats them as such, so no extra config needed.
};

export default config;
