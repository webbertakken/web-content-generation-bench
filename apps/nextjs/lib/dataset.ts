import { resolve } from 'node:path';
import { loadDataset } from '@bench/data/load';
import type { Dataset } from '@bench/data';

/**
 * Loads the shared dataset. Next.js spawns multiple worker processes for SSG,
 * each of which would otherwise re-parse the 160MB JSON for every page. A
 * module-level cache deduplicates per worker (any production Next.js app
 * would do the equivalent).
 */
let cached: Dataset | undefined;

export const loadBenchDataset = (): Dataset => {
  if (cached) return cached;
  const datasetPath = resolve(process.cwd(), '..', '..', 'packages', 'data', 'data.json');
  cached = loadDataset(datasetPath);
  return cached;
};
