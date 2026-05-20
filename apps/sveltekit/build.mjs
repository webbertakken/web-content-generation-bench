#!/usr/bin/env node
import { spawn } from 'node:child_process';
import { rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const requireFromApp = createRequire(resolve(here, 'package.json'));

const log = (label, started) => {
  const ms = Math.round(performance.now() - started);
  console.log(`[build] ${label} ${ms} ms`);
  return ms;
};

const t0 = performance.now();
rmSync(resolve(here, 'build'), { recursive: true, force: true });
rmSync(resolve(here, '.svelte-kit'), { recursive: true, force: true });

// SvelteKit builds via `vite build` under the hood. Use Vite's binary.
const viteMain = requireFromApp.resolve('vite');
// vite main is dist/node/index.js; binary is dist/node/cli.js usually, but the
// portable approach is via the published bin name.
const vitePkgDir = resolve(viteMain, '..', '..', '..');
const viteBin = resolve(vitePkgDir, 'bin', 'vite.js');

const buildStart = performance.now();
await new Promise((resolveProm, rejectProm) => {
  const child = spawn(process.execPath, [viteBin, 'build'], {
    cwd: here,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
  child.on('exit', (code) =>
    code === 0 ? resolveProm() : rejectProm(new Error(`vite build exit ${code}`)),
  );
});
log('sveltekit build', buildStart);

console.log(`[build] total ${Math.round(performance.now() - t0)} ms`);
