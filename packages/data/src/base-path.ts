/**
 * Returns the deployment base path read from `BENCH_BASE` (set by CI for
 * GitHub Pages). At local dev it is empty so every URL stays root-relative.
 *
 * Always returns either an empty string or a path with a leading slash and
 * no trailing slash, e.g. `/web-content-generation-bench/eleventy-react`.
 */
export const getBenchBase = (): string => {
  const raw = process.env['BENCH_BASE']?.trim() ?? '';
  if (!raw) return '';
  const withSlash = raw.startsWith('/') ? raw : `/${raw}`;
  return withSlash.endsWith('/') ? withSlash.slice(0, -1) : withSlash;
};

/** Prefix any absolute asset URL with the deployment base path. */
export const withBase = (path: string): string => {
  if (!path) return path;
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  const base = getBenchBase();
  if (!base) return path;
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
};
