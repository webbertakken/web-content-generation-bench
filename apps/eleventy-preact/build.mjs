#!/usr/bin/env node
import { build as esbuild } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, cpSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const tmp = resolve(here, 'build-tmp');
const publicOut = resolve(tmp, 'public', 'scripts');

const log = (label, started) => {
  const ms = Math.round(performance.now() - started);
  console.log(`[build] ${label} ${ms} ms`);
  return ms;
};

const fresh = (dir) => {
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
};

const t0 = performance.now();
fresh(tmp);
fresh(resolve(here, '_site'));
mkdirSync(publicOut, { recursive: true });

// React-to-Preact alias map shared between the server and client bundles.
// Components import from 'react' for ergonomic parity with the React app;
// esbuild rewrites those imports to preact/compat at build time.
const preactAliases = {
  react: 'preact/compat',
  'react-dom': 'preact/compat',
  'react-dom/client': 'preact/compat',
  'react-dom/server': 'preact-render-to-string',
  'react/jsx-runtime': 'preact/jsx-runtime',
  'react/jsx-dev-runtime': 'preact/jsx-runtime',
};

// 1. Server bundle (ESM, with createRequire banner for CJS interop).
const serverStart = performance.now();
await esbuild({
  entryPoints: [resolve(here, 'src', 'server-entry.tsx')],
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node22',
  outfile: resolve(tmp, 'server.js'),
  jsx: 'automatic',
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  external: ['node:*'],
  alias: preactAliases,
  banner: {
    js: [
      "import { createRequire as __bench_createRequire } from 'node:module';",
      "import { fileURLToPath as __bench_fileURLToPath } from 'node:url';",
      'const require = __bench_createRequire(import.meta.url);',
      'const __filename = __bench_fileURLToPath(import.meta.url);',
      "const __dirname = __filename.substring(0, __filename.lastIndexOf('/'));",
    ].join('\n'),
  },
  logLevel: 'warning',
});
log('server bundle', serverStart);

// 2. Client island bundle (React-aliased -> Preact, plus Pie web components).
const clientStart = performance.now();
await esbuild({
  entryPoints: [resolve(here, 'src', 'client', 'cart-island.tsx')],
  bundle: true,
  platform: 'browser',
  format: 'esm',
  target: 'es2022',
  outfile: resolve(publicOut, 'cart-island.js'),
  jsx: 'automatic',
  minify: true,
  loader: { '.tsx': 'tsx', '.ts': 'ts' },
  alias: preactAliases,
  logLevel: 'warning',
});
log('client bundle (cart + pie)', clientStart);

// 3. is-land library passthrough (yarn may hoist; resolve via Node).
const { createRequire } = await import('node:module');
const requireFromApp = createRequire(resolve(here, 'package.json'));
const isLandMain = requireFromApp.resolve('@11ty/is-land');
cpSync(isLandMain, resolve(publicOut, 'is-land.js'));

// 4. Eleventy build.
const eleventyMain = requireFromApp.resolve('@11ty/eleventy');
const eleventyBin = resolve(eleventyMain, '..', '..', 'cmd.cjs');
const eleventyStart = performance.now();
await new Promise((resolveProm, rejectProm) => {
  const child = spawn(process.execPath, [eleventyBin, '--config=eleventy.config.mjs'], {
    cwd: here,
    stdio: 'inherit',
  });
  child.on('exit', (code) =>
    code === 0 ? resolveProm() : rejectProm(new Error(`eleventy exit ${code}`)),
  );
});
log('eleventy build', eleventyStart);

console.log(`[build] total ${Math.round(performance.now() - t0)} ms`);
