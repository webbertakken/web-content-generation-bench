#!/usr/bin/env tsx
/**
 * Builds every app with the appropriate `BENCH_BASE` for GitHub Pages,
 * combines the outputs under `deploy-out/<app>/`, and emits a landing page
 * at `deploy-out/index.html` linking to each.
 *
 * Designed for the `pages.yml` workflow but also runnable locally:
 *   yarn workspace @bench/harness deploy --scale 5 --base /web-content-generation-bench
 */
import { spawn } from 'node:child_process';
import {
  copyFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { resolve } from 'node:path';
import { APPS, REPO_ROOT } from './lib/apps';
import type { AppConfig, ReportRow } from './lib/types';

interface StoredResults {
  scale: number;
  runs: number;
  rows: ReportRow[];
  generatedAt: string;
}

const loadResults = (): StoredResults | null => {
  const path = resolve(REPO_ROOT, 'docs', 'results.json');
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as StoredResults;
  } catch {
    return null;
  }
};

interface CliOptions {
  scale: number;
  base: string;
  apps: string[] | null;
  outDir: string;
}

const parseArgs = (argv: readonly string[]): CliOptions => {
  let scale = 5;
  let base = '/web-content-generation-bench';
  let apps: string[] | null = null;
  let outDir = resolve(REPO_ROOT, 'deploy-out');
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--scale') {
      scale = Number(argv[++i]);
    } else if (arg === '--base') {
      base = argv[++i] ?? '';
    } else if (arg === '--apps') {
      const value = argv[++i];
      apps = value ? value.split(',').map((s) => s.trim()) : null;
    } else if (arg === '--out') {
      outDir = resolve(argv[++i] ?? outDir);
    } else if (arg === '--help' || arg === '-h') {
      console.log(
        'Usage: yarn workspace @bench/harness deploy [--scale N] [--base /prefix] [--apps a,b,c] [--out path]',
      );
      process.exit(0);
    } else {
      throw new Error(`Unknown arg: ${arg}`);
    }
  }
  // Normalise base to a leading slash, no trailing slash.
  base = base.startsWith('/') ? base : `/${base}`;
  if (base.endsWith('/')) base = base.slice(0, -1);
  return { scale, base, apps, outDir };
};

const exec = (cmd: string, args: string[], cwd: string, env: NodeJS.ProcessEnv): Promise<number> =>
  new Promise((resolveProm) => {
    const child = spawn(cmd, args, {
      cwd,
      stdio: 'inherit',
      env,
      shell: process.platform === 'win32',
    });
    child.on('exit', (code) => resolveProm(code ?? 1));
  });

const generateDataset = async (scale: number): Promise<void> => {
  console.log(`\n[deploy] generating dataset with ${scale} restaurants`);
  const code = await exec(
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
    process.env,
  );
  if (code !== 0) throw new Error(`dataset generation failed (${code})`);
};

const buildApp = async (app: AppConfig, base: string): Promise<void> => {
  const appBase = `${base}/${app.id}`;
  console.log(`\n[deploy] === ${app.label} -> ${appBase} ===`);
  const env: NodeJS.ProcessEnv = { ...process.env, BENCH_BASE: appBase };
  const code = await exec('yarn', ['workspace', app.workspace, 'build'], REPO_ROOT, env);
  if (code !== 0) throw new Error(`${app.id} build failed (${code})`);
};

const escapeHtml = (s: string): string =>
  s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const formatBytes = (bytes: number): string => {
  if (bytes >= 1_000_000) return `${(bytes / 1_000_000).toFixed(2)} MB`;
  if (bytes >= 1_000) return `${(bytes / 1_000).toFixed(1)} KB`;
  return `${bytes} B`;
};
const formatMs = (ms: number): string =>
  ms >= 1000 ? `${(ms / 1000).toFixed(2)} s` : `${Math.round(ms)} ms`;

const landingPage = (
  apps: AppConfig[],
  base: string,
  scale: number,
  results: StoredResults | null,
): string => {
  const resultsByApp = new Map<string, ReportRow>();
  if (results) {
    for (const row of results.rows) resultsByApp.set(row.id, row);
  }

  const fastestRow = results ? [...results.rows].sort((a, b) => a.medianMs - b.medianMs)[0] : null;
  const lightestRow = results
    ? [...results.rows].sort((a, b) => a.bundle.initialJs - b.bundle.initialJs)[0]
    : null;
  const fewestLocRow = results
    ? [...results.rows].sort((a, b) => a.code.loc - b.code.loc)[0]
    : null;

  const winnersBlock = results
    ? `
  <section class="winners" aria-label="Headline winners">
    <div class="win">
      <span class="win-label">Fastest build (${results.scale} pages)</span>
      <span class="win-name">${escapeHtml(fastestRow?.label ?? '\u2013')}</span>
      <span class="win-value">${escapeHtml(fastestRow ? formatMs(fastestRow.medianMs) : '\u2013')}</span>
    </div>
    <div class="win">
      <span class="win-label">Smallest initial JS</span>
      <span class="win-name">${escapeHtml(lightestRow?.label ?? '\u2013')}</span>
      <span class="win-value">${escapeHtml(lightestRow ? formatBytes(lightestRow.bundle.initialJs) : '\u2013')}</span>
    </div>
    <div class="win">
      <span class="win-label">Fewest source lines</span>
      <span class="win-name">${escapeHtml(fewestLocRow?.label ?? '\u2013')}</span>
      <span class="win-value">${escapeHtml(fewestLocRow ? `${fewestLocRow.code.loc.toLocaleString()} LOC` : '\u2013')}</span>
    </div>
  </section>`
    : '';

  const tableBlock = results
    ? `
  <section aria-labelledby="results-table-heading">
    <h2 id="results-table-heading">Benchmark snapshot</h2>
    <p class="sub">Cold build of ${results.scale} pages, median of ${results.runs} runs. <a href="${base}/bench/">See the full report with charts</a>.</p>
    <div class="table-wrap">
      <table>
        <thead>
          <tr><th>Framework</th><th>Build</th><th>Per page</th><th>Initial JS</th><th>HTML / page</th><th>LOC</th></tr>
        </thead>
        <tbody>
          ${results.rows
            .map(
              (r) => `<tr>
            <th scope="row"><a href="${base}/${r.id}/urban-yard-0/">${escapeHtml(r.label)}</a></th>
            <td>${escapeHtml(formatMs(r.medianMs))}</td>
            <td>${escapeHtml(formatMs(r.msPerPage))}</td>
            <td>${escapeHtml(formatBytes(r.bundle.initialJs))}</td>
            <td>${escapeHtml(formatBytes(r.bundle.htmlSampleBytes))}</td>
            <td>${r.code.loc.toLocaleString()}</td>
          </tr>`,
            )
            .join('')}
        </tbody>
      </table>
    </div>
  </section>`
    : '';

  const cards = apps
    .map((a) => {
      const row = resultsByApp.get(a.id);
      const stats = row
        ? `<dl class="card-stats">
          <div><dt>Build</dt><dd>${escapeHtml(formatMs(row.medianMs))}</dd></div>
          <div><dt>Init JS</dt><dd>${escapeHtml(formatBytes(row.bundle.initialJs))}</dd></div>
          <div><dt>LOC</dt><dd>${row.code.loc.toLocaleString()}</dd></div>
        </dl>`
        : '';
      return `
      <article class="card">
        <h3>${escapeHtml(a.label)}</h3>
        ${stats}
        <a class="cta" href="${base}/${a.id}/urban-yard-0/">Sample restaurant &rarr;</a>
        <a class="link" href="${base}/${a.id}/">Browse root</a>
      </article>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Web content generation benchmark</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,700&family=Inter:wght@400;500;600&display=swap">
  <style>
    :root {
      color-scheme: light dark;
      --bg: #fff; --fg: #161616; --muted: #555; --border: #d6d6d6;
      --card: #fafafa; --accent: #ff6f00;
    }
    @media (prefers-color-scheme: dark) {
      :root { --bg: #0c0c0c; --fg: #f0f0f0; --muted: #aaa; --border: #2a2a2a; --card: #1a1a1a; }
    }
    * { box-sizing: border-box; }
    body {
      max-width: 1080px; margin: 0 auto; padding: 2.5rem 1.5rem 4rem;
      font-family: 'Inter', system-ui, sans-serif; line-height: 1.55;
      background: var(--bg); color: var(--fg);
    }
    h1 {
      font-family: 'Fraunces', Georgia, serif;
      font-size: clamp(2rem, 1rem + 3vw, 2.75rem);
      margin: 0 0 0.5rem; letter-spacing: -0.01em;
    }
    h2 { font-family: 'Fraunces', Georgia, serif; font-size: 1.5rem; margin: 2.5rem 0 0.5rem; }
    p.lead { color: var(--muted); font-size: 1.1rem; margin: 0 0 2rem; max-width: 75ch; }
    p.sub { color: var(--muted); margin: 0 0 1rem; }
    a { color: var(--accent); }
    .winners {
      display: grid; gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      margin-bottom: 1rem;
    }
    .win {
      padding: 1rem 1.25rem; background: var(--card); border: 1px solid var(--border);
      border-radius: 10px; display: flex; flex-direction: column; gap: 0.25rem;
    }
    .win-label {
      font-size: 0.8rem; color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .win-name {
      font-family: 'Fraunces', Georgia, serif;
      font-size: 1.2rem; color: var(--accent); font-weight: 600;
    }
    .win-value { font-weight: 600; font-variant-numeric: tabular-nums; }
    .table-wrap {
      overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; margin-bottom: 1.5rem;
    }
    table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; font-size: 0.92rem; }
    th, td { padding: 0.55rem 0.85rem; text-align: right; border-bottom: 1px solid var(--border); }
    th[scope="row"] { text-align: left; font-weight: 600; }
    thead th { font-weight: 600; background: var(--card); font-size: 0.85rem; }
    th[scope="row"] a { color: inherit; text-decoration: none; }
    th[scope="row"] a:hover { color: var(--accent); }
    .grid {
      display: grid; gap: 1rem;
      grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
      margin-top: 1rem;
    }
    .card {
      padding: 1.25rem 1.5rem; border: 1px solid var(--border); border-radius: 10px;
      background: var(--card);
    }
    .card h3 {
      font-family: 'Fraunces', Georgia, serif;
      margin: 0 0 0.75rem; font-size: 1.3rem; color: var(--accent);
    }
    .card-stats {
      display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.5rem; margin: 0 0 1rem;
    }
    .card-stats > div { display: flex; flex-direction: column; gap: 0.1rem; }
    .card-stats dt {
      font-size: 0.75rem; color: var(--muted);
      text-transform: uppercase; letter-spacing: 0.04em;
    }
    .card-stats dd { margin: 0; font-weight: 600; font-variant-numeric: tabular-nums; }
    .cta {
      display: inline-block; padding: 0.55rem 1rem; background: var(--accent); color: white;
      border-radius: 6px; text-decoration: none; font-weight: 600; margin-bottom: 0.5rem;
    }
    .cta:hover { background: #cc5800; }
    .link { display: block; color: var(--muted); font-size: 0.9rem; text-decoration: none; }
    .link:hover { text-decoration: underline; color: var(--accent); }
    footer {
      margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border);
      color: var(--muted); font-size: 0.9rem;
    }
  </style>
</head>
<body>
  <h1>Web content generation benchmark</h1>
  <p class="lead">Six static-site builds of the same takeaway menu, deployed side by side. Same dataset, same Pie design system, different framework. Below: the latest measured numbers and the live demos.</p>
  ${winnersBlock}
  ${tableBlock}
  <h2>Live demos (built at ${scale} ${scale === 1 ? 'restaurant' : 'restaurants'})</h2>
  <div class="grid">${cards}
  </div>
  <footer>
    <a href="${base}/bench/">Full benchmark report (charts + per-app detail)</a> &middot;
    <a href="https://github.com/webbertakken/web-content-generation-bench">Source code</a>
  </footer>
</body>
</html>`;
};

const main = async (): Promise<void> => {
  const opts = parseArgs(process.argv.slice(2));
  const appsToBuild = opts.apps ? APPS.filter((a) => opts.apps!.includes(a.id)) : APPS;
  if (appsToBuild.length === 0) {
    console.error('[deploy] no apps selected');
    process.exit(1);
  }

  rmSync(opts.outDir, { recursive: true, force: true });
  mkdirSync(opts.outDir, { recursive: true });

  await generateDataset(opts.scale);

  for (const app of appsToBuild) {
    await buildApp(app, opts.base);
    const destDir = resolve(opts.outDir, app.id);
    mkdirSync(destDir, { recursive: true });
    cpSync(app.outDir, destDir, { recursive: true });
    console.log(`[deploy] copied ${app.id} -> ${destDir}`);
  }

  // Landing page at the root of the deployment, enriched with the latest
  // benchmark snapshot from docs/results.json when available.
  const results = loadResults();
  if (results) {
    console.log(
      `[deploy] embedding benchmark snapshot (${results.scale} pages \u00d7 ${results.runs} runs, generated ${results.generatedAt})`,
    );
  } else {
    console.log('[deploy] no docs/results.json found; landing page will show demos only');
  }
  const landing = landingPage(appsToBuild, opts.base, opts.scale, results);
  writeFileSync(resolve(opts.outDir, 'index.html'), landing);

  // Drop the latest benchmark report into deploy-out/bench/ if present.
  const docsDir = resolve(REPO_ROOT, 'docs');
  if (existsSync(resolve(docsDir, 'index.html'))) {
    const benchDir = resolve(opts.outDir, 'bench');
    mkdirSync(benchDir, { recursive: true });
    cpSync(docsDir, benchDir, { recursive: true });
    console.log(`[deploy] copied docs/* -> ${benchDir}`);
  }

  console.log(`\n[deploy] ready at ${opts.outDir} (base path "${opts.base}")`);
};

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
