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
rmSync(resolve(here, 'dist'), { recursive: true, force: true });
rmSync(resolve(here, '.astro'), { recursive: true, force: true });

// Astro's main entry is dist/index.js; the CLI sits at bin/astro.mjs alongside.
const astroMain = requireFromApp.resolve('astro');
const astroBin = resolve(astroMain, '..', '..', 'bin', 'astro.mjs');

const astroStart = performance.now();
await new Promise((resolveProm, rejectProm) => {
  const child = spawn(process.execPath, [astroBin, 'build'], {
    cwd: here,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
  child.on('exit', (code) =>
    code === 0 ? resolveProm() : rejectProm(new Error(`astro exit ${code}`)),
  );
});
log('astro build', astroStart);

console.log(`[build] total ${Math.round(performance.now() - t0)} ms`);
