import { defineConfig } from 'astro/config';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
  output: 'static',
  integrations: [react()],
  vite: {
    // Pie web components self-register; we let them be imported in the React
    // island and rely on Vite's tree-shaking. Nothing extra needed here.
  },
});
