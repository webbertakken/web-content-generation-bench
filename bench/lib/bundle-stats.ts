import { readdirSync, statSync, readFileSync, existsSync } from 'node:fs';
import { extname, join } from 'node:path';
import type { BundleStats } from './types';

interface AssetSummary {
  totalJs: number;
  totalCss: number;
  initialJs: number;
  initialCss: number;
}

const sizeOf = (file: string): number => {
  try {
    return statSync(file).size;
  } catch {
    return 0;
  }
};

const walk = (dir: string, cb: (file: string) => void): void => {
  let entries;
  try {
    entries = readdirSync(dir);
  } catch {
    return;
  }
  for (const entry of entries) {
    const full = join(dir, entry);
    let stat;
    try {
      stat = statSync(full);
    } catch {
      continue;
    }
    if (stat.isDirectory()) walk(full, cb);
    else cb(full);
  }
};

/**
 * Approximate "initial JS/CSS": every script/link in the canonical HTML page,
 * resolved against the output directory. Anything not referenced by that page
 * counts only towards the total.
 */
/**
 * "Initial JS" here is the bytes a browser will fetch to make the page
 * interactive: anything in <script src>, <link rel=modulepreload>, and the
 * `import="..."` of <is-land>. That captures lazy islands too, since the
 * browser fetches them as soon as the page is idle.
 */
const collectInitialAssets = (outDir: string, htmlPath: string): { js: number; css: number } => {
  if (!existsSync(htmlPath)) return { js: 0, css: 0 };
  const html = readFileSync(htmlPath, 'utf8');
  const collectMatches = (re: RegExp): string[] =>
    Array.from(html.matchAll(re)).map((m) => m[1] ?? '');

  const jsRefs = new Set<string>([
    ...collectMatches(/<script[^>]+src=["']([^"']+)["']/gi),
    ...collectMatches(/<link[^>]+rel=["']modulepreload["'][^>]+href=["']([^"']+)["']/gi),
    ...collectMatches(/<link[^>]+href=["']([^"']+\.js)["'][^>]+rel=["']modulepreload["']/gi),
    ...collectMatches(/<is-land[^>]+import=["']([^"']+)["']/gi),
  ]);
  const cssRefs = new Set<string>([
    ...collectMatches(/<link[^>]+rel=["']stylesheet["'][^>]+href=["']([^"']+)["']/gi),
    ...collectMatches(/<link[^>]+href=["']([^"']+\.css)["'][^>]+rel=["']stylesheet["']/gi),
  ]);

  const resolveAsset = (ref: string): string | null => {
    if (!ref) return null;
    if (ref.startsWith('http://') || ref.startsWith('https://')) return null;
    const trimmed = ref.replace(/^\/+/, '');
    const candidate = join(outDir, trimmed);
    return existsSync(candidate) ? candidate : null;
  };

  let js = 0;
  for (const src of jsRefs) {
    const file = resolveAsset(src);
    if (file) js += sizeOf(file);
  }
  let css = 0;
  for (const href of cssRefs) {
    const file = resolveAsset(href);
    if (file) css += sizeOf(file);
  }
  return { js, css };
};

export const collectBundleStats = (outDir: string, sampleHtml: string): BundleStats => {
  const summary: AssetSummary = { totalJs: 0, totalCss: 0, initialJs: 0, initialCss: 0 };
  let totalBytes = 0;
  walk(outDir, (file) => {
    const ext = extname(file).toLowerCase();
    const size = sizeOf(file);
    totalBytes += size;
    if (ext === '.js' || ext === '.mjs' || ext === '.cjs') summary.totalJs += size;
    else if (ext === '.css') summary.totalCss += size;
  });
  const initial = collectInitialAssets(outDir, sampleHtml);
  summary.initialJs = initial.js;
  summary.initialCss = initial.css;
  return {
    initialJs: summary.initialJs,
    initialCss: summary.initialCss,
    totalJs: summary.totalJs,
    totalCss: summary.totalCss,
    htmlSampleBytes: existsSync(sampleHtml) ? sizeOf(sampleHtml) : 0,
    totalOutputBytes: totalBytes,
  };
};
