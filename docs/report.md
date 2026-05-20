# Benchmark report

Pages built per app: **1000**. Runs per app: **3** (median reported).
Generated: 2026-05-20T17:11:18.961Z.

| Framework         | Cold build | Per page | Initial JS | Initial CSS | Total JS | HTML/page | Output total | Source LOC | Files |
| ----------------- | ---------- | -------- | ---------- | ----------- | -------- | --------- | ------------ | ---------- | ----- |
| Eleventy + React  | 24.25 s    | 24 ms    | 378.8 KB   | 4.9 KB      | 378.8 KB | 271.0 KB  | 344.32 MB    | 625        | 13    |
| Eleventy + Preact | 14.56 s    | 15 ms    | 203.4 KB   | 4.9 KB      | 203.4 KB | 270.9 KB  | 344.06 MB    | 634        | 13    |
| Astro + React     | 26.66 s    | 27 ms    | 344.8 KB   | 4.9 KB      | 364.0 KB | 400.7 KB  | 507.27 MB    | 519        | 9     |
| Astro + Preact    | 24.00 s    | 24 ms    | 164.2 KB   | 4.9 KB      | 198.3 KB | 400.7 KB  | 507.12 MB    | 517        | 9     |
| Next.js           | 59.88 s    | 60 ms    | 631.7 KB   | 151.1 KB    | 918.3 KB | 534.3 KB  | 1978.93 MB   | 549        | 10    |
| SvelteKit         | 42.60 s    | 43 ms    | 87.2 KB    | 4.9 KB      | 252.7 KB | 261.6 KB  | 470.18 MB    | 484        | 10    |

## Per-app detail

### Eleventy + React

- Cold build (median of 3): **24.25 s** (best 23.18 s, worst 29.14 s)
- Per page: 24 ms
- Initial JS: 378.8 KB
- Initial CSS: 4.9 KB
- Total JS (incl. lazy): 378.8 KB
- Total CSS: 174.4 KB
- Sample HTML size (1 page): 271.0 KB
- Total output on disk: 344.32 MB
- Source files: 13, LOC: 625
- LOC by extension: .tsx 309, .css 194, .mjs 92, .js 19, .ts 11

### Eleventy + Preact

- Cold build (median of 3): **14.56 s** (best 12.52 s, worst 19.21 s)
- Per page: 15 ms
- Initial JS: 203.4 KB
- Initial CSS: 4.9 KB
- Total JS (incl. lazy): 203.4 KB
- Total CSS: 174.4 KB
- Sample HTML size (1 page): 270.9 KB
- Total output on disk: 344.06 MB
- Source files: 13, LOC: 634
- LOC by extension: .tsx 309, .css 194, .mjs 101, .js 19, .ts 11

### Astro + React

- Cold build (median of 3): **26.66 s** (best 25.04 s, worst 60.04 s)
- Per page: 27 ms
- Initial JS: 344.8 KB
- Initial CSS: 4.9 KB
- Total JS (incl. lazy): 364.0 KB
- Total CSS: 174.4 KB
- Sample HTML size (1 page): 400.7 KB
- Total output on disk: 507.27 MB
- Source files: 9, LOC: 519
- LOC by extension: .css 194, .tsx 190, .astro 87, .mjs 37, .ts 11

### Astro + Preact

- Cold build (median of 3): **24.00 s** (best 23.29 s, worst 24.94 s)
- Per page: 24 ms
- Initial JS: 164.2 KB
- Initial CSS: 4.9 KB
- Total JS (incl. lazy): 198.3 KB
- Total CSS: 174.4 KB
- Sample HTML size (1 page): 400.7 KB
- Total output on disk: 507.12 MB
- Source files: 9, LOC: 517
- LOC by extension: .css 194, .tsx 190, .astro 87, .mjs 35, .ts 11

### Next.js

- Cold build (median of 3): **59.88 s** (best 55.01 s, worst 71.58 s)
- Per page: 60 ms
- Initial JS: 631.7 KB
- Initial CSS: 151.1 KB
- Total JS (incl. lazy): 918.3 KB
- Total CSS: 151.1 KB
- Sample HTML size (1 page): 534.3 KB
- Total output on disk: 1978.93 MB
- Source files: 10, LOC: 549
- LOC by extension: .tsx 283, .css 194, .mjs 50, .ts 22

### SvelteKit

- Cold build (median of 3): **42.60 s** (best 35.94 s, worst 68.36 s)
- Per page: 43 ms
- Initial JS: 87.2 KB
- Initial CSS: 4.9 KB
- Total JS (incl. lazy): 252.7 KB
- Total CSS: 174.4 KB
- Sample HTML size (1 page): 261.6 KB
- Total output on disk: 470.18 MB
- Source files: 10, LOC: 484
- LOC by extension: .svelte 214, .css 194, .mjs 29, .ts 27, .js 20
