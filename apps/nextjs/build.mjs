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
rmSync(resolve(here, 'out'), { recursive: true, force: true });
rmSync(resolve(here, '.next'), { recursive: true, force: true });

// Next.js CLI lives at <pkg>/dist/bin/next, exposed in package.json bin.
const nextMain = requireFromApp.resolve('next');
// next's main resolves to .../next/dist/server/...; walk up to find dist/bin/next.
const nextPkgDir = resolve(nextMain, '..', '..', '..');
const nextBin = resolve(nextPkgDir, 'dist', 'bin', 'next');

const nextStart = performance.now();
await new Promise((resolveProm, rejectProm) => {
  const child = spawn(process.execPath, [nextBin, 'build'], {
    cwd: here,
    stdio: 'inherit',
    env: { ...process.env, NODE_ENV: 'production' },
  });
  child.on('exit', (code) =>
    code === 0 ? resolveProm() : rejectProm(new Error(`next exit ${code}`)),
  );
});
log('next build', nextStart);

console.log(`[build] total ${Math.round(performance.now() - t0)} ms`);
