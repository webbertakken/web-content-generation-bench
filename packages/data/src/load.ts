import { readFileSync } from 'node:fs';
import type { Dataset } from './types';

/**
 * Conventional relative location of the generated dataset from this package.
 * Apps and the bench harness can use it, but must resolve it themselves
 * (the helper deliberately avoids `import.meta.url` so the module is safe to
 * bundle into CJS targets).
 */
export const DATASET_RELATIVE_PATH = 'packages/data/data.json';

/**
 * Loads a generated dataset from disk. Caller must pass the path; we keep
 * this strict so the same JSON drives every framework's build.
 */
export const loadDataset = (path: string): Dataset => {
  const raw = readFileSync(path, 'utf8');
  return JSON.parse(raw) as Dataset;
};
