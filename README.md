# Web content generation benchmark

A benchmark suite that compares static site generators on a realistic workload: a takeaway-style menu page with categorised items, a sauce-selection modal, and a client-side cart. Each framework builds the same site from the same locally-generated dataset of 10,000 restaurants, and we measure compile time, bundle size, and code complexity.

See [`plans/benchmark.md`](plans/benchmark.md) for the implementation plan and locked-in decisions.

## Frameworks compared

- Eleventy + React (islands via `@11ty/is-land`)
- Eleventy + Preact (with `preact/compat` alias)
- Astro + React
- Next.js (App Router, static export)
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

(Filled in once the bench harness lands; see plan section 11.)
