#!/usr/bin/env tsx
/**
 * Serve every framework's built output on its own port, plus a landing page
 * on the index port that links to each one. No npm dependencies; just
 * Node's built-in http + fs. SPA-style fallback to index.html for directories.
 */
import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs';
import { extname, resolve, join, normalize } from 'node:path';
import { APPS } from './lib/apps';

const INDEX_PORT = 4000;
const APP_PORTS: Record<string, number> = {
  'eleventy-react': 4001,
  'eleventy-preact': 4002,
  'astro-react': 4003,
  'astro-preact': 4006,
  nextjs: 4004,
  sveltekit: 4005,
};

const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

const send = (
  res: import('node:http').ServerResponse,
  status: number,
  body: string,
  type = 'text/plain; charset=utf-8',
): void => {
  res.writeHead(status, { 'content-type': type });
  res.end(body);
};

const resolveTarget = (root: string, urlPath: string): string | null => {
  // Strip query string and decode.
  const decoded = decodeURIComponent(urlPath.split('?')[0] ?? '/');
  // Prevent path traversal: normalise + ensure result stays inside root.
  const candidate = normalize(join(root, decoded));
  if (!candidate.startsWith(root)) return null;

  // Next.js produces `<slug>.html` at root AND a `<slug>/` directory full of
  // RSC payload files. Try the `.html` sibling first when the requested path
  // is a directory-like URL.
  const trimmed = decoded.replace(/\/$/, '');
  if (trimmed && trimmed !== '/') {
    const htmlGuess = normalize(join(root, `${trimmed}.html`));
    if (htmlGuess.startsWith(root) && existsSync(htmlGuess) && statSync(htmlGuess).isFile()) {
      return htmlGuess;
    }
  }

  if (!existsSync(candidate)) return null;
  const stat = statSync(candidate);
  if (stat.isDirectory()) {
    const indexFile = join(candidate, 'index.html');
    return existsSync(indexFile) ? indexFile : null;
  }
  return candidate;
};

const sniffMime = (file: string, ext: string): string => {
  const baseline = MIME_TYPES[ext] ?? 'application/octet-stream';
  // Placeholder header images are SVG written with a .jpg extension so the
  // existing builds (which reference .jpg) keep rendering. Peek at the first
  // bytes to override the mime type when content is SVG.
  if (ext === '.jpg' || ext === '.jpeg') {
    try {
      const head = readFileSync(file, { encoding: 'utf8', flag: 'r' }).slice(0, 200);
      if (head.includes('<svg') || head.includes('<?xml')) return 'image/svg+xml';
    } catch {
      // ignore and fall back to baseline
    }
  }
  return baseline;
};

const serveFile = (
  req: import('node:http').IncomingMessage,
  res: import('node:http').ServerResponse,
  root: string,
): void => {
  const file = resolveTarget(root, req.url ?? '/');
  if (!file) {
    send(res, 404, `404: ${req.url}`);
    return;
  }
  const ext = extname(file).toLowerCase();
  const mime = sniffMime(file, ext);
  res.writeHead(200, { 'content-type': mime, 'cache-control': 'no-cache' });
  createReadStream(file).pipe(res);
};

const escapeHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const landingPage = (
  samples: {
    id: string;
    label: string;
    port: number;
    sampleUrl: string;
    rootUrl: string;
    outOk: boolean;
  }[],
): string => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Benchmark - live preview</title>
  <style>
    :root { color-scheme: light dark; font-family: system-ui, sans-serif; }
    body { max-width: 900px; margin: 0 auto; padding: 2rem 1.5rem; line-height: 1.6; }
    h1 { font-size: 1.8rem; }
    p { color: #555; }
    .app { display: grid; grid-template-columns: 200px 1fr 1fr; gap: 0.5rem 1rem; align-items: baseline; padding: 0.75rem 0; border-bottom: 1px solid #ddd; }
    .app strong { font-size: 1.05rem; }
    .app a { color: #ff6f00; text-decoration: none; }
    .app a:hover { text-decoration: underline; }
    .missing { color: #b00; font-style: italic; }
    .also { margin-top: 2rem; color: #555; font-size: 0.9rem; }
    code { background: rgba(255, 111, 0, 0.15); padding: 0.1em 0.3em; border-radius: 3px; }
  </style>
</head>
<body>
  <h1>Benchmark - live preview</h1>
  <p>Each framework's static output is served on its own port. Click "First restaurant" to see the canonical sample page (urban-yard-0).</p>
  <div class="apps">
    ${samples
      .map(
        (s) => `
    <div class="app">
      <strong>${escapeHtml(s.label)}</strong>
      ${
        s.outOk
          ? `<a href="${escapeHtml(s.rootUrl)}" target="_blank" rel="noopener">Root (port ${s.port})</a>
         <a href="${escapeHtml(s.sampleUrl)}" target="_blank" rel="noopener">First restaurant</a>`
          : `<span class="missing">Output dir missing. Run <code>yarn workspace @bench/app-${escapeHtml(s.id)} build</code>.</span>`
      }
    </div>`,
      )
      .join('')}
  </div>
  <div class="also">
    <p>Also: <a href="/docs/index.html">Benchmark overview</a> with the latest numbers + charts.</p>
  </div>
</body>
</html>`;

// ---------- start servers ----------
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(here, '..');

for (const app of APPS) {
  const port = APP_PORTS[app.id];
  if (!port) continue;
  const outOk = existsSync(app.outDir);
  if (!outOk) {
    console.warn(`[serve] ${app.id}: ${app.outDir} does not exist; skipping`);
    continue;
  }
  const root = resolve(app.outDir);
  createServer((req, res) => serveFile(req, res, root)).listen(port, () => {
    console.log(`[serve] ${app.label.padEnd(20)} -> http://localhost:${port}/  (root: ${root})`);
  });
}

// Index server.
const samples = APPS.map((a) => {
  const port = APP_PORTS[a.id] ?? 0;
  return {
    id: a.id,
    label: a.label,
    port,
    rootUrl: `http://localhost:${port}/`,
    sampleUrl: `http://localhost:${port}/urban-yard-0/`,
    outOk: existsSync(a.outDir),
  };
});

createServer((req, res) => {
  const url = req.url ?? '/';
  if (url === '/' || url === '/index.html') {
    send(res, 200, landingPage(samples), 'text/html; charset=utf-8');
    return;
  }
  if (url.startsWith('/docs/')) {
    serveFile(req, res, resolve(repoRoot, 'docs'));
    return;
  }
  send(res, 404, `404: ${url}`);
}).listen(INDEX_PORT, () => {
  console.log(`\n[serve] Landing -> http://localhost:${INDEX_PORT}/\n`);
});
