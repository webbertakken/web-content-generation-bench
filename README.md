# Web content generation benchmark

A benchmark suite that compares static site generators on a realistic workload: a takeaway-style menu page with categorised items, a sauce-selection modal, and a client-side cart. Each framework builds the same site from the same locally-generated dataset of 1,000 restaurants, and we measure compile time, bundle size, and code complexity.

**→ [Live demos + benchmark report](https://webbertakken.github.io/web-content-generation-bench/)**

See [`plans/benchmark.md`](plans/benchmark.md) for the implementation plan and locked-in decisions.

## Frameworks compared

- Eleventy + React (islands via `@11ty/is-land`)
- Eleventy + Preact (with `preact/compat` alias)
- Astro + React
- Astro + Preact (with `preact/compat` via the integration)
- Next.js (App Router, static export, Turbopack)
- SvelteKit (adapter-static, prerender all)

## Prerequisites

- [mise](https://mise.jdx.dev) (handles Node)
- Corepack enabled (`corepack enable`) so Yarn Berry is auto-installed from `packageManager`

```bash
mise install
corepack enable
yarn install
```

## Repository layout

```
.
├── packages/
│   ├── data/         # deterministic 10k restaurant mock generator + types
│   └── cart-core/    # framework-agnostic cart logic
├── apps/
│   ├── eleventy-react/
│   ├── eleventy-preact/
│   ├── astro-react/
│   ├── nextjs/
│   └── sveltekit/
├── bench/            # benchmark harness
├── plans/
└── docs/
```

## Common commands

```bash
yarn typecheck   # all workspaces
yarn test        # all workspaces
yarn build       # all workspaces (topological)
yarn format      # oxfmt --write
```

Linting is intentionally off for now; oxlint will be added once the prototype works.

## Running the benchmark

```bash
yarn data                                  # regenerate the 1000-restaurant dataset
yarn workspace @bench/harness bench        # run all 6 frameworks, 3 cold builds each
yarn workspace @bench/harness check-parity # confirm all apps produced equivalent DOM
```

Results land in `bench/results/<timestamp>/` and the latest copies overwrite `docs/index.html` (interactive overview with charts) and `docs/report.md` (plain text).

If you tweak the report templates and want to refresh without re-running every build:

```bash
yarn workspace @bench/harness render-reports          # re-render the latest results
yarn workspace @bench/harness render-reports --rescan # also rescan on-disk bundle stats
```

See [`docs/index.html`](docs/index.html) for the latest overview.

## Browsing locally

After building (`yarn build`), start the local preview server:

```bash
yarn workspace @bench/harness serve
```

This serves each app on its own port (4001–4006) plus a landing page on http://localhost:4000/.

## Deploying

`yarn workspace @bench/harness deploy --scale 5 --base /web-content-generation-bench` builds every app with the appropriate basePath, combines them under `deploy-out/`, and writes a landing page with the embedded benchmark snapshot. The GitHub Actions workflow at `.github/workflows/pages.yml` runs this on every push to `main` and publishes to GitHub Pages.

## License

MIT. See [`LICENSE`](LICENSE).
