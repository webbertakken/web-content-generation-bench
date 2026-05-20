#!/usr/bin/env tsx
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { APPS, REPO_ROOT, findSampleHtml } from './lib/apps';
import { collectBundleStats } from './lib/bundle-stats';
import { collectCodeStats } from './lib/code-stats';
import { renderHtmlReport } from './lib/html-report';
import type { ReportRow, RunResult, AppConfig } from './lib/types';

interface CliOptions {
  scale: number;
  runs: number;
  apps: string[] | null;
  outDir: string;
}

const parseArgs = (argv: readonly string[]): CliOptions => {
  let scale = 1000;
  let runs = 3;
  let apps: string[] | null = null;
  let outDir = resolve(REPO_ROOT, 'bench', 'results', String(Date.now()));
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--scale') {
      const value = argv[i + 1];
      if (!value) throw new Error('--scale requires a value');
      scale = Number(value);
      i += 1;
    } else if (arg === '--runs') {
      const value = argv[i + 1];
      if (!value) throw new Error('--runs requires a value');
      runs = Number(value);
      i += 1;
    } else if (arg === '--apps') {
      const value = argv[i + 1];
      if (!value) throw new Error('--apps requires a value');
      apps = value.split(',').map((s) => s.trim());
      i += 1;
    } else if (arg === '--out') {
      const value = argv[i + 1];
      if (!value) throw new Error('--out requires a value');
      outDir = resolve(value);
      i += 1;
    } else {
      throw new Error(`Unknown arg: ${arg}`);
    }
  }
  return { scale, runs, apps, outDir };
};

const exec = (
  cmd: string,
  args: string[],
  cwd: string,
): Promise<{ code: number; durationMs: number }> =>
  new Promise((resolveProm) => {
    const startedAt = performance.now();
    const child = spawn(cmd, args, { cwd, stdio: 'inherit', shell: process.platform === 'win32' });
    child.on('exit', (code) =>
      resolveProm({ code: code ?? 1, durationMs: performance.now() - startedAt }),
    );
  });

const generateDataset = async (scale: number): Promise<void> => {
  console.log(`\n[bench] regenerating dataset with ${scale} restaurants`);
  const { code } = await exec(
    'yarn',
    [
      'workspace',
      '@bench/data',
      'generate',
      '--count',
      String(scale),
      '--seed',
      'bench-default',
      '--out',
      '../../packages/data/data.json',
    ],
    REPO_ROOT,
  );
  if (code !== 0) throw new Error(`dataset generation failed with code ${code}`);
};

const runOneApp = async (app: AppConfig, scale: number, runs: number): Promise<RunResult> => {
  console.log(`\n[bench] === ${app.label} (${app.id}) ===`);
  const cold: RunResult['cold'] = [];
  for (let i = 0; i < runs; i += 1) {
    console.log(`[bench] run ${i + 1}/${runs}`);
    const { code, durationMs } = await exec(
      'yarn',
      ['workspace', app.workspace, 'build'],
      REPO_ROOT,
    );
    cold.push({ ms: durationMs, ok: code === 0 });
    if (code !== 0) {
      console.error(`[bench] ${app.id} build failed (run ${i + 1})`);
      break;
    }
  }

  // For bundle stats, use the most recent build's output.
  const slug = 'urban-yard-0'; // first deterministic slug from seed 'bench-default'
  const sampleHtml = findSampleHtml(app.outDir, slug);
  // Next.js may produce <slug>.html at root instead of <slug>/index.html.
  const altSampleHtml = resolve(app.outDir, `${slug}.html`);
  const html = existsSync(sampleHtml) ? sampleHtml : altSampleHtml;
  const bundle = collectBundleStats(app.outDir, html);
  const code = collectCodeStats(app.appDir);
  return { cold, bundle, code, scale };
};

const median = (values: number[]): number => {
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0
    ? ((sorted[mid - 1] ?? 0) + (sorted[mid] ?? 0)) / 2
    : (sorted[mid] ?? 0);
};

const formatBytes = (bytes: number): string => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
};

const formatMs = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;

const renderReport = (rows: ReportRow[], opts: CliOptions): string => {
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
    `Pages built per app: **${opts.scale}**. Runs per app: **${opts.runs}** (median reported).`,
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
      `- Cold build (median of ${opts.runs}): **${formatMs(row.medianMs)}**` +
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

const main = async (): Promise<void> => {
  const opts = parseArgs(process.argv.slice(2));
  const appsToRun = opts.apps ? APPS.filter((a) => opts.apps!.includes(a.id)) : APPS;
  if (appsToRun.length === 0) {
    console.error('[bench] no apps selected');
    process.exit(1);
  }

  mkdirSync(opts.outDir, { recursive: true });

  await generateDataset(opts.scale);

  const results: Record<string, RunResult> = {};
  for (const app of appsToRun) {
    results[app.id] = await runOneApp(app, opts.scale, opts.runs);
  }

  const rows: ReportRow[] = appsToRun.map((app) => {
    const result = results[app.id]!;
    const okRuns = result.cold.filter((r) => r.ok).map((r) => r.ms);
    const medianMs = okRuns.length ? median(okRuns) : NaN;
    return {
      id: app.id,
      label: app.label,
      scale: opts.scale,
      medianMs,
      bestMs: okRuns.length ? Math.min(...okRuns) : NaN,
      worstMs: okRuns.length ? Math.max(...okRuns) : NaN,
      msPerPage: medianMs / opts.scale,
      bundle: result.bundle,
      code: result.code,
    };
  });

  const reportJson = {
    scale: opts.scale,
    runs: opts.runs,
    rows,
    results,
    generatedAt: new Date().toISOString(),
  };
  writeFileSync(resolve(opts.outDir, 'results.json'), JSON.stringify(reportJson, null, 2));
  const md = renderReport(rows, opts);
  const html = renderHtmlReport(rows, opts);
  writeFileSync(resolve(opts.outDir, 'report.md'), md);
  writeFileSync(resolve(opts.outDir, 'index.html'), html);
  // Also overwrite the canonical latest reports under docs/ so they are easy
  // to read. The HTML is the headline overview.
  const docsDir = resolve(REPO_ROOT, 'docs');
  mkdirSync(docsDir, { recursive: true });
  writeFileSync(resolve(docsDir, 'report.md'), md);
  writeFileSync(resolve(docsDir, 'index.html'), html);

  console.log(`\n[bench] report written to ${opts.outDir}`);
  console.log(`[bench] overview at docs/index.html`);
  console.log(`[bench] markdown at docs/report.md`);
  console.log(`\n${md}`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
