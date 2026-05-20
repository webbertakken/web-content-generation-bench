# Web content generation benchmark

Compare static site generators (Eleventy, Astro, Next.js, SvelteKit, optionally Vite) on a realistic menu + cart workload, using a shared dataset and the Pie design system.

**Scale: 1,000 restaurants** (originally 10k, reduced because V8 OOMs serialising ~4.7M items into one JSON file). 1k still gives a meaningful build-time difference across frameworks while keeping memory headroom for the generator and each framework's build step.

## Decisions locked in

- **Q1**: 1k restaurants, each on its own "domain" (simulated via one menu page per restaurant). Dataset = 1k restaurants × (5 categories × 5-200 items). Reduced from 10k to fit in V8 memory.
- **Q2**: Eleventy islands via `@11ty/is-land`. Only the cart + modal hydrate.
- **Q3**: Cart is in-memory only, lost on reload.
- **Q4**: Pie components: `pie-modal` + `pie-button` + `pie-card` + form input for sauce selection.
- **Q5**: LOC + file count + bundle size.
- **Q6**: Five frameworks: Eleventy+React, Eleventy+Preact, Astro+React, Next.js, SvelteKit. No Vite.
- **Q7**: Yarn Berry workspaces, Node LTS via mise.
- **Q8**: Report initial JS, initial CSS, and total transferred (incl. lazy) side by side.

## Other locked-in decisions

- Monorepo at the root, one app per framework under `apps/`.
- Shared dataset and types under `packages/data/`.
- Benchmark harness under `bench/`, produces a Markdown report + JSON.
- Cold builds only (no incremental). Warm caches cleared between runs.
- 3 runs per framework, take the median.
- Single-page build time: build with just 1 restaurant in the dataset. Full build: 1k.
- All data local, no network calls during build.
- WCAG 2.2 AA, focus management on the modal, prefers-color-scheme respected.
- Yarn linker: `node-modules` (not PnP) to avoid framework resolution quirks.

---

## Plan

### 0. Repo bootstrapping

- [x] Initialise `package.json` with yarn berry workspaces
- [x] Pin Node via `mise.toml`, pin yarn via `packageManager`
- [x] Add `.gitignore` (node_modules, dist, .next, .svelte-kit, \_site, .astro, benchmark output)
- [x] Add `.editorconfig`, `.gitattributes`, `prettier`, shared `tsconfig.base.json`
- [x] Add root `README.md` with how-to-run
- [x] Initial commit on `wf-1857-init-bench` branch

### 1. Shared data package (`packages/data/`)

- [x] Define TypeScript types: `Restaurant`, `Category`, `Item`, `Sauce`
- [x] Write deterministic mock generator using a seeded PRNG (so all frameworks see identical input)
- [x] Generator parameters: restaurant count, categories per restaurant (fixed at 5), items per category (5-200, seeded), sauce options per item
- [x] CLI `yarn workspace @bench/data generate --count 1000 --out ./data.json`
- [x] Unit tests: determinism (same seed = same output), shape validation, item-count bounds (14 tests, all green)
- [ ] Header image: bundle local placeholder images; reference by relative path (deferred to app integration step)
- [x] Commit

### 2. Shared cart logic package (`packages/cart-core/`)

- [x] Pure functions: `addLine`, `removeLine`, `setLineQuantity`, `cartTotalCents`, `cartItemCount`, `serialiseForCheckout`
- [x] Framework-agnostic (no React, no Svelte). Just TypeScript.
- [x] Unit tests covering every path, including empty cart, duplicate items, sauce variations (18 tests, all green)
- [x] Commit

### 3. Pie design system integration probe

- [ ] Spike: confirm `@justeattakeaway/pie-modal` (web component) works in a vanilla HTML page
- [ ] Spike: confirm React wrappers exist or write a thin one
- [ ] Document Pie version and any quirks in `docs/pie-integration.md`
- [ ] Commit

### 4. App: Eleventy + React (`apps/eleventy-react/`)

- [ ] Init Eleventy with `@11ty/eleventy` and JSX plugin (`@11ty/eleventy-plugin-render` or `eleventy-plugin-react`)
- [ ] Configure pagination over `data.json` to emit one page per restaurant
- [ ] Build the menu template (header, 5 category sections, basket aside)
- [ ] Wire `pie-modal` for sauce selection
- [ ] Hydrate cart logic per Q2 decision
- [ ] Verify single-restaurant build, then 10k build
- [ ] Commit

### 5. App: Eleventy + Preact (`apps/eleventy-preact/`)

- [ ] Copy `apps/eleventy-react`, swap React for Preact + `preact/compat` alias
- [ ] Verify identical visual output (diff screenshots via Playwright)
- [ ] Commit

### 6. App: Astro + React (`apps/astro-react/`)

- [ ] Init Astro with `@astrojs/react` integration
- [ ] `getStaticPaths` from `data.json` to emit one page per restaurant
- [ ] Build the menu template using `.astro` files for static parts, React island for the cart, Pie modal as web component
- [ ] Choose hydration directive (`client:load` for cart, `client:visible` for modal trigger)
- [ ] Commit

### 7. App: Next.js (`apps/nextjs/`)

- [ ] Init Next.js with App Router and `output: 'export'`
- [ ] `generateStaticParams` from `data.json` for one route per restaurant
- [ ] Server components for static parts, client component for cart
- [ ] Pie modal as web component inside a client component
- [ ] Commit

### 8. App: SvelteKit (`apps/sveltekit/`)

- [ ] Init SvelteKit with `adapter-static` and prerender all
- [ ] `entries()` from `data.json` for one route per restaurant
- [ ] Svelte stores for cart, Pie modal as web component
- [ ] Commit

### 9. App: Vite SSG (`apps/vite-ssg/`) (only if Q6 = B or D)

- [ ] Init Vite + `vite-plugin-ssg` (or similar) with Lit or vanilla web components
- [ ] Same template, same data
- [ ] Commit

### 10. Visual parity check

- [ ] Playwright snapshot test: build each app for 1 restaurant, screenshot the menu page, diff against a reference
- [ ] If diffs are unacceptable, fix the offending app
- [ ] Commit

### 11. Benchmark harness (`bench/`)

- [ ] `bench/run.ts`: for each app, run cold build N=3 with 1 restaurant and N=3 with 10k, record wall-clock from `performance.now()`
- [ ] Capture peak RSS via `process.resourceUsage()` or `pidusage`
- [ ] Compute bundle sizes by walking the output dir for `.js`, `.css`, etc., distinguishing initial vs lazy chunks
- [ ] Compute LOC via `cloc` or `tokei`
- [ ] Compute cyclomatic + cognitive complexity per Q5
- [ ] Output `bench/results/<timestamp>/{results.json, report.md}`
- [ ] Commit

### 12. Reproducibility

- [ ] Document exact versions of every framework in `docs/versions.md`
- [ ] `bench/verify.ts`: re-run from clean checkout, confirm results within tolerance
- [ ] CI workflow: smoke build for each app on every PR (not full 10k, just 100)
- [ ] Commit

### 13. Report

- [ ] `docs/report.md`: results table, charts (markdown-mermaid or static PNG), narrative observations
- [ ] Commit and tag `v0.1.0`

---

## Risks and gotchas to revisit

- **Eleventy + JSX maturity**: the JSX story in Eleventy 3 is via `@11ty/eleventy-plugin-render` or community plugins; may need a custom transform. Spike first.
- **Pie web components in Next.js App Router**: web components need a client boundary; SSR can break custom-element registration. Probe early.
- **SvelteKit adapter-static with 10k routes**: known to be slow with very large route tables; measure.
- **Determinism across frameworks**: any non-deterministic build step (e.g. content hashing in different orders) will skew bundle size comparisons. Lock down where possible.
- **10k restaurants = 10k HTML files**: filesystem I/O may dominate on Windows. Consider also reporting time-to-first-page-output.
