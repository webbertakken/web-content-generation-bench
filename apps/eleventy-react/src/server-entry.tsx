/**
 * Entry exposed to the Eleventy template (via the bundled build-tmp/server.cjs).
 *
 * The TSX components above are React functional components that render to a
 * static HTML string here. No hydration logic in this file.
 */
import { renderToStaticMarkup } from 'react-dom/server';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Restaurant, Dataset } from '@bench/data';
import { loadDataset as loadDatasetRaw } from '@bench/data/load';
import { Menu } from './components/Menu.js';

export const renderRestaurantHtml = (restaurant: Restaurant): string =>
  `<!DOCTYPE html>${renderToStaticMarkup(<Menu restaurant={restaurant} />)}`;

/**
 * Resolves the shared dataset relative to the bundled server module location
 * (`apps/eleventy-react/build-tmp/server.js`). The result is the canonical
 * dataset JSON inside @bench/data, identical across every framework.
 */
export const loadDataset = (): Dataset => {
  const here = dirname(fileURLToPath(import.meta.url));
  const datasetPath = resolve(here, '..', '..', '..', 'packages', 'data', 'data.json');
  return loadDatasetRaw(datasetPath);
};
