import type { ReportRow } from './types';

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

interface ChartBar {
  label: string;
  value: number;
  display: string;
}

const renderBarChart = (title: string, bars: ChartBar[], unit: string): string => {
  const maxValue = Math.max(...bars.map((b) => b.value), 1);
  // Find the best (lowest) value for highlighting.
  const bestValue = Math.min(...bars.map((b) => b.value));
  const rows = bars
    .map((b) => {
      const pct = Math.max((b.value / maxValue) * 100, 0.5);
      const isBest = b.value === bestValue;
      return `
    <div class="bar-row${isBest ? ' bar-row--best' : ''}">
      <div class="bar-label">${escapeHtml(b.label)}</div>
      <div class="bar-track" role="progressbar" aria-valuemin="0" aria-valuemax="${maxValue}" aria-valuenow="${b.value}" aria-label="${escapeHtml(b.label)}: ${escapeHtml(b.display)}">
        <div class="bar-fill" style="width: ${pct.toFixed(2)}%"></div>
      </div>
      <div class="bar-value">${escapeHtml(b.display)}${isBest ? ' <span class="best-badge">best</span>' : ''}</div>
    </div>`;
    })
    .join('');
  return `<section class="chart" aria-labelledby="chart-${escapeHtml(title.replace(/\W+/g, '-'))}">
  <h3 id="chart-${escapeHtml(title.replace(/\W+/g, '-'))}">${escapeHtml(title)} <span class="unit">(${escapeHtml(unit)})</span></h3>
  <div class="bars">${rows}
  </div>
</section>`;
};

const ratio = (a: number, b: number): string => {
  if (!b) return '\u2013';
  const r = a / b;
  return r >= 1 ? `${r.toFixed(2)}\u00d7` : `${(1 / r).toFixed(2)}\u00d7 smaller`;
};

export const renderHtmlReport = (
  rows: ReportRow[],
  opts: { scale: number; runs: number },
): string => {
  const sortedByTime = [...rows].sort((a, b) => a.medianMs - b.medianMs);
  const fastest = sortedByTime[0];
  const slowestByTime = sortedByTime[sortedByTime.length - 1];
  const sortedByBundle = [...rows].sort((a, b) => a.bundle.initialJs - b.bundle.initialJs);
  const lightestBundle = sortedByBundle[0];
  const sortedByLoc = [...rows].sort((a, b) => a.code.loc - b.code.loc);
  const fewestLoc = sortedByLoc[0];

  const buildTimeBars: ChartBar[] = rows.map((r) => ({
    label: r.label,
    value: r.medianMs,
    display: formatMs(r.medianMs),
  }));
  const perPageBars: ChartBar[] = rows.map((r) => ({
    label: r.label,
    value: r.msPerPage,
    display: formatMs(r.msPerPage),
  }));
  const initialJsBars: ChartBar[] = rows.map((r) => ({
    label: r.label,
    value: r.bundle.initialJs,
    display: formatBytes(r.bundle.initialJs),
  }));
  const htmlPageBars: ChartBar[] = rows.map((r) => ({
    label: r.label,
    value: r.bundle.htmlSampleBytes,
    display: formatBytes(r.bundle.htmlSampleBytes),
  }));
  const totalOutputBars: ChartBar[] = rows.map((r) => ({
    label: r.label,
    value: r.bundle.totalOutputBytes,
    display: formatBytes(r.bundle.totalOutputBytes),
  }));
  const locBars: ChartBar[] = rows.map((r) => ({
    label: r.label,
    value: r.code.loc,
    display: r.code.loc.toLocaleString(),
  }));

  const tableRows = rows
    .map(
      (r) => `
      <tr>
        <th scope="row">${escapeHtml(r.label)}</th>
        <td>${escapeHtml(formatMs(r.medianMs))}</td>
        <td>${escapeHtml(formatMs(r.msPerPage))}</td>
        <td>${escapeHtml(formatBytes(r.bundle.initialJs))}</td>
        <td>${escapeHtml(formatBytes(r.bundle.initialCss))}</td>
        <td>${escapeHtml(formatBytes(r.bundle.totalJs))}</td>
        <td>${escapeHtml(formatBytes(r.bundle.htmlSampleBytes))}</td>
        <td>${escapeHtml(formatBytes(r.bundle.totalOutputBytes))}</td>
        <td>${r.code.loc.toLocaleString()}</td>
        <td>${r.code.files}</td>
      </tr>`,
    )
    .join('');

  const perAppCards = rows
    .map((r) => {
      const byExt = Object.entries(r.code.byExt)
        .sort(([, a], [, b]) => b.loc - a.loc)
        .map(
          ([ext, info]) =>
            `<li><code>${escapeHtml(ext)}</code>: ${info.loc.toLocaleString()} LOC across ${info.files} files</li>`,
        )
        .join('');
      return `
      <article class="card" id="app-${escapeHtml(r.id)}">
        <h3>${escapeHtml(r.label)}</h3>
        <dl class="kv">
          <dt>Cold build (median of ${opts.runs})</dt>
          <dd>${escapeHtml(formatMs(r.medianMs))}</dd>
          <dt>Best / worst</dt>
          <dd>${escapeHtml(formatMs(r.bestMs))} / ${escapeHtml(formatMs(r.worstMs))}</dd>
          <dt>Per page</dt>
          <dd>${escapeHtml(formatMs(r.msPerPage))}</dd>
          <dt>Initial JS</dt>
          <dd>${escapeHtml(formatBytes(r.bundle.initialJs))}</dd>
          <dt>Initial CSS</dt>
          <dd>${escapeHtml(formatBytes(r.bundle.initialCss))}</dd>
          <dt>Total JS (incl. lazy)</dt>
          <dd>${escapeHtml(formatBytes(r.bundle.totalJs))}</dd>
          <dt>HTML / page</dt>
          <dd>${escapeHtml(formatBytes(r.bundle.htmlSampleBytes))}</dd>
          <dt>Output total on disk</dt>
          <dd>${escapeHtml(formatBytes(r.bundle.totalOutputBytes))}</dd>
          <dt>Source files</dt>
          <dd>${r.code.files}</dd>
          <dt>Source LOC</dt>
          <dd>${r.code.loc.toLocaleString()}</dd>
        </dl>
        <details>
          <summary>LOC by extension</summary>
          <ul>${byExt}</ul>
        </details>
      </article>`;
    })
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Web content generation benchmark - overview</title>
  <style>
    :root {
      color-scheme: light dark;
      --bg: #ffffff;
      --fg: #161616;
      --muted: #555;
      --border: #d6d6d6;
      --card: #fafafa;
      --accent: #ff6f00;
      --accent-dim: #ffbb6633;
      --best: #1f7a3f;
      --best-bg: #d8f5e2;
      --shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      font-family: system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    }
    @media (prefers-color-scheme: dark) {
      :root {
        --bg: #0c0c0c;
        --fg: #f0f0f0;
        --muted: #aaa;
        --border: #2a2a2a;
        --card: #161616;
        --best: #6be0a0;
        --best-bg: #143b21;
        --shadow: 0 1px 2px rgba(0, 0, 0, 0.4);
      }
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      background: var(--bg);
      color: var(--fg);
      line-height: 1.55;
      font-size: 16px;
    }
    .container { max-width: 1100px; margin: 0 auto; padding: 2rem 1.5rem 4rem; }
    h1 { font-size: 2rem; margin: 0 0 0.5rem; }
    .subtitle { color: var(--muted); margin: 0 0 2rem; font-size: 1.05rem; }
    h2 { margin: 2.5rem 0 1rem; font-size: 1.5rem; border-bottom: 2px solid var(--accent); padding-bottom: 0.25rem; }
    h3 { margin: 0 0 0.75rem; font-size: 1.15rem; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
      margin-bottom: 1rem;
    }
    .summary-card {
      padding: 1rem 1.25rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .summary-card h3 { font-size: 0.875rem; color: var(--muted); font-weight: 500; margin: 0 0 0.25rem; text-transform: uppercase; letter-spacing: 0.05em; }
    .summary-card p { margin: 0; font-size: 1.05rem; font-weight: 600; }
    .summary-card .winner { color: var(--accent); }

    table {
      width: 100%;
      border-collapse: collapse;
      font-variant-numeric: tabular-nums;
      font-size: 0.9rem;
    }
    th, td {
      padding: 0.5rem 0.75rem;
      text-align: right;
      border-bottom: 1px solid var(--border);
    }
    th[scope="row"] { text-align: left; font-weight: 600; }
    thead th { font-weight: 600; background: var(--card); position: sticky; top: 0; }
    .table-wrap { overflow-x: auto; border: 1px solid var(--border); border-radius: 8px; }

    .chart { margin: 1.5rem 0; }
    .chart .unit { color: var(--muted); font-weight: 400; font-size: 0.9rem; }
    .bars { display: grid; gap: 0.5rem; }
    .bar-row {
      display: grid;
      grid-template-columns: 200px 1fr 160px;
      gap: 0.75rem;
      align-items: center;
    }
    .bar-label { font-weight: 500; font-size: 0.95rem; }
    .bar-track { height: 1.2rem; background: var(--accent-dim); border-radius: 3px; overflow: hidden; }
    .bar-fill { height: 100%; background: var(--accent); transition: width 200ms ease; }
    .bar-value { font-variant-numeric: tabular-nums; font-size: 0.9rem; color: var(--muted); }
    .bar-row--best .bar-fill { background: var(--best); }
    .bar-row--best .bar-value { color: var(--best); font-weight: 600; }
    .best-badge {
      background: var(--best-bg);
      color: var(--best);
      padding: 0 0.4rem;
      border-radius: 3px;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .charts-grid { display: grid; gap: 2rem; margin-top: 1rem; }
    @media (max-width: 700px) {
      .bar-row { grid-template-columns: 1fr; }
      .bar-label { font-weight: 600; }
    }

    .cards {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 1rem;
      margin-top: 1rem;
    }
    .card {
      padding: 1rem 1.25rem;
      background: var(--card);
      border: 1px solid var(--border);
      border-radius: 8px;
      box-shadow: var(--shadow);
    }
    .card h3 { margin: 0 0 0.75rem; color: var(--accent); }
    .kv { margin: 0; display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; font-size: 0.9rem; }
    .kv dt { color: var(--muted); }
    .kv dd { margin: 0; text-align: right; font-variant-numeric: tabular-nums; font-weight: 500; }
    details { margin-top: 0.75rem; }
    summary { cursor: pointer; color: var(--muted); font-size: 0.9rem; }
    details ul { margin: 0.5rem 0 0; padding-left: 1rem; font-size: 0.85rem; }

    .meta {
      margin-top: 3rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border);
      color: var(--muted);
      font-size: 0.85rem;
    }
    code { font-family: "JetBrains Mono", ui-monospace, monospace; font-size: 0.85em; background: var(--accent-dim); padding: 0.1em 0.3em; border-radius: 3px; }
    a { color: var(--accent); }

    /* skip link */
    .skip-link {
      position: absolute;
      top: -40px;
      left: 0;
      background: var(--accent);
      color: #fff;
      padding: 0.5rem 1rem;
      z-index: 100;
      text-decoration: none;
    }
    .skip-link:focus { top: 0; }
  </style>
</head>
<body>
  <a class="skip-link" href="#results">Skip to results</a>
  <div class="container">
    <header>
      <h1>Web content generation benchmark</h1>
      <p class="subtitle">
        Building <strong>${opts.scale} restaurant menu pages</strong> across five static site generators.
        Median of <strong>${opts.runs} cold builds</strong> per framework, identical input dataset, identical Pie design system.
      </p>
    </header>

    <section class="summary" aria-label="Headline winners">
      <div class="summary-card">
        <h3>Fastest build</h3>
        <p><span class="winner">${escapeHtml(fastest?.label ?? '\u2013')}</span></p>
        <p><small>${escapeHtml(fastest ? formatMs(fastest.medianMs) : '\u2013')} (${escapeHtml(fastest && slowestByTime ? `${ratio(slowestByTime.medianMs, fastest.medianMs)} faster than slowest` : '')})</small></p>
      </div>
      <div class="summary-card">
        <h3>Smallest initial JS</h3>
        <p><span class="winner">${escapeHtml(lightestBundle?.label ?? '\u2013')}</span></p>
        <p><small>${escapeHtml(lightestBundle ? formatBytes(lightestBundle.bundle.initialJs) : '\u2013')}</small></p>
      </div>
      <div class="summary-card">
        <h3>Fewest source lines</h3>
        <p><span class="winner">${escapeHtml(fewestLoc?.label ?? '\u2013')}</span></p>
        <p><small>${escapeHtml(fewestLoc ? `${fewestLoc.code.loc.toLocaleString()} LOC` : '\u2013')}</small></p>
      </div>
    </section>

    <h2 id="results">Results table</h2>
    <div class="table-wrap">
      <table>
        <caption class="sr-only">Benchmark metrics per framework</caption>
        <thead>
          <tr>
            <th scope="col">Framework</th>
            <th scope="col">Cold build</th>
            <th scope="col">Per page</th>
            <th scope="col">Initial JS</th>
            <th scope="col">Initial CSS</th>
            <th scope="col">Total JS</th>
            <th scope="col">HTML/page</th>
            <th scope="col">Output total</th>
            <th scope="col">Source LOC</th>
            <th scope="col">Files</th>
          </tr>
        </thead>
        <tbody>${tableRows}
        </tbody>
      </table>
    </div>

    <h2>Charts</h2>
    <div class="charts-grid">
      ${renderBarChart('Cold build time (full ' + opts.scale + ' pages)', buildTimeBars, 'milliseconds, lower is better')}
      ${renderBarChart('Per-page build time', perPageBars, 'milliseconds, lower is better')}
      ${renderBarChart('Initial JS shipped to client', initialJsBars, 'bytes, lower is better')}
      ${renderBarChart('HTML size per page (sample)', htmlPageBars, 'bytes, lower is better')}
      ${renderBarChart('Total output on disk', totalOutputBars, 'bytes, lower is better')}
      ${renderBarChart('Source lines of code (app-only)', locBars, 'lines, lower is better')}
    </div>

    <h2>Per-framework detail</h2>
    <div class="cards">${perAppCards}</div>

    <footer class="meta">
      Generated ${new Date().toISOString()} from <code>bench/run.ts</code>.
      Source: <a href="https://github.com/">repo</a>.
      See <a href="report.md"><code>report.md</code></a> for a plain-text version.
    </footer>
  </div>
</body>
</html>`;
};
