#!/usr/bin/env tsx
/**
 * Re-render the markdown + HTML reports from an existing results.json.
 * Useful after tweaking the report templates without re-running the benches.
 *
 * Usage: yarn workspace @bench/harness render-reports [path/to/results.json]
 */
import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APPS, REPO_ROOT, findSampleHtml } from './lib/apps';
import { collectBundleStats } from './lib/bundle-stats';
import { collectCodeStats } from './lib/code-stats';
import { renderHtmlReport } from './lib/html-report';
import type { ReportRow } from './lib/types';

interface Stored {
  scale: number;
  runs: number;
  rows: ReportRow[];
  generatedAt: string;
}

const findLatestResults = (): string => {
  const dir = resolve(REPO_ROOT, 'bench', 'results');
  if (!existsSync(dir)) throw new Error(`No bench/results directory at ${dir}`);
  const candidates = readdirSync(dir)
    .map((name) => resolve(dir, name))
    .filter((p) => statSync(p).isDirectory())
    .map((p) => ({ p, json: resolve(p, 'results.json') }))
    .filter((c) => existsSync(c.json))
    .sort((a, b) => statSync(b.json).mtimeMs - statSync(a.json).mtimeMs);
  if (candidates.length === 0) throw new Error('No results.json found under bench/results/');
  // Safe non-null: filter guarantees at least one element.
  return candidates[0]!.json;
};

const formatBytes = (bytes: number): string => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
};
const formatMs = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;

const renderMarkdown = (rows: ReportRow[], scale: number, runs: number): string => {
  const headers = [
    'Framework',
    'Cold build',
    'Per page',
    'Initial JS',
    'Initial CSS',
    'Total JS',
    'HTML/page',
    'Output total',
    'Source LOC',
    'Files',
  ];
  const lines = [
    `# Benchmark report`,
    ``,
    `Pages built per app: **${scale}**. Runs per app: **${runs}** (median reported).`,
    `Generated: ${new Date().toISOString()}.`,
    ``,
    `| ${headers.join(' | ')} |`,
    `| ${headers.map(() => '---').join(' | ')} |`,
  ];
  for (const row of rows) {
    lines.push(
      `| ${row.label}` +
        ` | ${formatMs(row.medianMs)}` +
        ` | ${formatMs(row.msPerPage)}` +
        ` | ${formatBytes(row.bundle.initialJs)}` +
        ` | ${formatBytes(row.bundle.initialCss)}` +
        ` | ${formatBytes(row.bundle.totalJs)}` +
        ` | ${formatBytes(row.bundle.htmlSampleBytes)}` +
        ` | ${formatBytes(row.bundle.totalOutputBytes)}` +
        ` | ${row.code.loc.toLocaleString()}` +
        ` | ${row.code.files} |`,
    );
  }
  lines.push(``, `## Per-app detail`, ``);
  for (const row of rows) {
    lines.push(
      `### ${row.label}`,
      ``,
      `- Cold build (median of ${runs}): **${formatMs(row.medianMs)}**` +
        ` (best ${formatMs(row.bestMs)}, worst ${formatMs(row.worstMs)})`,
      `- Per page: ${formatMs(row.msPerPage)}`,
      `- Initial JS: ${formatBytes(row.bundle.initialJs)}`,
      `- Initial CSS: ${formatBytes(row.bundle.initialCss)}`,
      `- Total JS (incl. lazy): ${formatBytes(row.bundle.totalJs)}`,
      `- Total CSS: ${formatBytes(row.bundle.totalCss)}`,
      `- Sample HTML size (1 page): ${formatBytes(row.bundle.htmlSampleBytes)}`,
      `- Total output on disk: ${formatBytes(row.bundle.totalOutputBytes)}`,
      `- Source files: ${row.code.files}, LOC: ${row.code.loc}`,
      `- LOC by extension: ${Object.entries(row.code.byExt)
        .sort(([, a], [, b]) => b.loc - a.loc)
        .map(([ext, info]) => `${ext} ${info.loc}`)
        .join(', ')}`,
      ``,
    );
  }
  return lines.join('\n');
};

// Separate flags from the optional positional path argument.
const args = process.argv.slice(2);
const rescan = args.includes('--rescan');
const positional = args.filter((a) => !a.startsWith('--'));
const inputPath = positional[0] ? resolve(positional[0]) : findLatestResults();
console.log(`[render-reports] reading ${inputPath}`);
const stored = JSON.parse(readFileSync(inputPath, 'utf8')) as Stored;

// Optional re-scan: walks each app's output directory again, picking up bug
// fixes to bundle-stats without re-running every build.
if (rescan) {
  console.log('[render-reports] rescanning bundle + code stats from on-disk outputs');
  for (const row of stored.rows) {
    const app = APPS.find((a) => a.id === row.id);
    if (!app) continue;
    const slug = 'urban-yard-0';
    const sampleHtml = findSampleHtml(app.outDir, slug);
    const altSampleHtml = resolve(app.outDir, `${slug}.html`);
    const html = existsSync(sampleHtml) ? sampleHtml : altSampleHtml;
    if (existsSync(html)) {
      row.bundle = collectBundleStats(app.outDir, html);
    } else {
      console.warn(`[render-reports] ${app.id}: no HTML at ${html}, keeping cached bundle`);
    }
    row.code = collectCodeStats(app.appDir);
  }
  // Persist the rescanned numbers back so subsequent renders are correct.
  writeFileSync(inputPath, JSON.stringify(stored, null, 2));
}

const md = renderMarkdown(stored.rows, stored.scale, stored.runs);
const html = renderHtmlReport(stored.rows, { scale: stored.scale, runs: stored.runs });

const docsDir = resolve(REPO_ROOT, 'docs');
mkdirSync(docsDir, { recursive: true });
writeFileSync(resolve(docsDir, 'report.md'), md);
writeFileSync(resolve(docsDir, 'index.html'), html);

// Also drop them into the original results dir for archival.
const resultsDir = resolve(inputPath, '..');
writeFileSync(resolve(resultsDir, 'report.md'), md);
writeFileSync(resolve(resultsDir, 'index.html'), html);

console.log(`[render-reports] wrote docs/index.html and docs/report.md`);
