/**
 * Server entry for Eleventy + Preact (compat). Components themselves continue
 * to import from 'react' (and use React's @types) so they are textually
 * identical to the React app; esbuild aliases redirect those imports to
 * preact/compat at bundle time.
 *
 * For the server render, we explicitly use preact-render-to-string because
 * its API differs from react-dom/server.
 */
import { renderToString } from 'preact-render-to-string';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Restaurant, Dataset } from '@bench/data';
import { loadDataset as loadDatasetRaw } from '@bench/data/load';
import { Menu } from './components/Menu.js';

export const renderRestaurantHtml = (restaurant: Restaurant): string =>
  `<!DOCTYPE html>${renderToString(<Menu restaurant={restaurant} />)}`;

export const loadDataset = (): Dataset => {
  const here = dirname(fileURLToPath(import.meta.url));
  const datasetPath = resolve(here, '..', '..', '..', 'packages', 'data', 'data.json');
  return loadDatasetRaw(datasetPath);
};
