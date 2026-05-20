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
import { copyFileSync, cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { APPS, REPO_ROOT } from './lib/apps';
import type { AppConfig } from './lib/types';

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

const landingPage = (apps: AppConfig[], base: string, scale: number): string => {
  const cards = apps
    .map(
      (a) => `
      <article class="card">
        <h3>${a.label}</h3>
        <a class="cta" href="${base}/${a.id}/urban-yard-0/">Sample restaurant -&gt;</a>
        <a class="link" href="${base}/${a.id}/">Browse root</a>
      </article>`,
    )
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
    :root { color-scheme: light dark; }
    body { max-width: 980px; margin: 0 auto; padding: 2rem 1.5rem; font-family: 'Inter', system-ui, sans-serif; line-height: 1.55; }
    h1 { font-family: 'Fraunces', Georgia, serif; font-size: 2.5rem; margin: 0 0 0.5rem; letter-spacing: -0.01em; }
    p.lead { color: #666; font-size: 1.1rem; margin: 0 0 2rem; }
    .grid { display: grid; gap: 1rem; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .card { padding: 1rem 1.25rem; border: 1px solid #d6d6d6; border-radius: 10px; background: #fafafa; }
    @media (prefers-color-scheme: dark) { .card { background: #1a1a1a; border-color: #2a2a2a; } p.lead { color: #aaa; } }
    .card h3 { font-family: 'Fraunces', Georgia, serif; margin: 0 0 0.75rem; font-size: 1.25rem; color: #ff6f00; }
    .cta { display: inline-block; padding: 0.5rem 1rem; background: #ff6f00; color: white; border-radius: 6px; text-decoration: none; font-weight: 600; margin-bottom: 0.5rem; }
    .cta:hover { background: #cc5800; }
    .link { display: block; color: #666; font-size: 0.9rem; text-decoration: none; }
    @media (prefers-color-scheme: dark) { .link { color: #aaa; } }
    .link:hover { text-decoration: underline; }
    footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid #d6d6d6; color: #666; font-size: 0.9rem; }
    footer a { color: #ff6f00; }
  </style>
</head>
<body>
  <h1>Web content generation benchmark</h1>
  <p class="lead">Six static-site builds of the same takeaway menu, deployed side by side. Each was built from the same dataset (${scale} restaurants) using a different framework.</p>
  <div class="grid">${cards}
  </div>
  <footer>
    <a href="${base}/bench/">Benchmark report (charts + tables)</a> &middot;
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

  // Landing page at the root of the deployment.
  const landing = landingPage(appsToBuild, opts.base, opts.scale);
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
