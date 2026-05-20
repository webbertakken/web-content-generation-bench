#!/usr/bin/env node
import { build as esbuild } from 'esbuild';
import { spawn } from 'node:child_process';
import { mkdirSync, rmSync, cpSync, existsSync } from 'node:fs';
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

// 1. Server bundle: TSX -> ESM that the .11ty.js template can import.
//    CJS dependencies (react-dom/server) use require() internally; the banner
//    injects a createRequire so that survives the ESM output format.
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
  banner: {
    js: [
      "import { createRequire as __bench_createRequire } from 'node:module';",
      "import { fileURLToPath as __bench_fileURLToPath } from 'node:url';",
      'const require = __bench_createRequire(import.meta.url);',
      '// eslint-disable-next-line',
      'const __filename = __bench_fileURLToPath(import.meta.url);',
      "const __dirname = __filename.substring(0, __filename.lastIndexOf('/'));",
    ].join('\n'),
  },
  logLevel: 'warning',
});
log('server bundle', serverStart);

// 2. Client island bundle (the React cart + Pie web components).
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
  logLevel: 'warning',
});
log('client bundle (cart + pie)', clientStart);

// 3. is-land library: ship the standard build alongside.
const isLandSrc = resolve(here, 'node_modules', '@11ty', 'is-land', 'is-land.js');
if (existsSync(isLandSrc)) {
  cpSync(isLandSrc, resolve(publicOut, 'is-land.js'));
}

// 4. Eleventy. Eleventy 3 ships cmd.cjs but does not list it (or package.json)
//    in the exports map, so use the main entry and walk up to find the dir.
const { createRequire } = await import('node:module');
const requireFromApp = createRequire(resolve(here, 'package.json'));
const eleventyMain = requireFromApp.resolve('@11ty/eleventy'); // ../src/Eleventy.js
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
