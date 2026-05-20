# Benchmark report

Pages built per app: **1000**. Runs per app: **3** (median reported).
Generated: 2026-05-20T16:48:17.498Z.

| Framework         | Cold build | Per page | Initial JS | Initial CSS | Total JS | HTML/page | Output total | Source LOC | Files |
| ----------------- | ---------- | -------- | ---------- | ----------- | -------- | --------- | ------------ | ---------- | ----- |
| Eleventy + React  | 34.56 s    | 35 ms    | 378.8 KB   | 3.5 KB      | 378.8 KB | 270.7 KB  | 343.81 MB    | 586        | 13    |
| Eleventy + Preact | 11.85 s    | 12 ms    | 203.4 KB   | 3.5 KB      | 203.4 KB | 270.6 KB  | 343.56 MB    | 595        | 13    |
| Astro + React     | 31.22 s    | 31 ms    | 344.8 KB   | 3.5 KB      | 364.0 KB | 400.4 KB  | 506.78 MB    | 479        | 9     |
| Next.js           | 68.32 s    | 68 ms    | 631.7 KB   | 2.8 KB      | 918.3 KB | 532.6 KB  | 1974.28 MB   | 505        | 10    |
| SvelteKit         | 35.23 s    | 35 ms    | 84.2 KB    | 3.5 KB      | 249.6 KB | 141.5 KB  | 178.34 MB    | 447        | 10    |

## Per-app detail

### Eleventy + React

- Cold build (median of 3): **34.56 s** (best 32.30 s, worst 41.04 s)
- Per page: 35 ms
- Initial JS: 378.8 KB
- Initial CSS: 3.5 KB
- Total JS (incl. lazy): 378.8 KB
- Total CSS: 3.5 KB
- Sample HTML size (1 page): 270.7 KB
- Total output on disk: 343.81 MB
- Source files: 13, LOC: 586
- LOC by extension: .tsx 302, .css 162, .mjs 92, .js 19, .ts 11

### Eleventy + Preact

- Cold build (median of 3): **11.85 s** (best 11.81 s, worst 14.20 s)
- Per page: 12 ms
- Initial JS: 203.4 KB
- Initial CSS: 3.5 KB
- Total JS (incl. lazy): 203.4 KB
- Total CSS: 3.5 KB
- Sample HTML size (1 page): 270.6 KB
- Total output on disk: 343.56 MB
- Source files: 13, LOC: 595
- LOC by extension: .tsx 302, .css 162, .mjs 101, .js 19, .ts 11

### Astro + React

- Cold build (median of 3): **31.22 s** (best 27.97 s, worst 50.30 s)
- Per page: 31 ms
- Initial JS: 344.8 KB
- Initial CSS: 3.5 KB
- Total JS (incl. lazy): 364.0 KB
- Total CSS: 3.5 KB
- Sample HTML size (1 page): 400.4 KB
- Total output on disk: 506.78 MB
- Source files: 9, LOC: 479
- LOC by extension: .tsx 190, .css 162, .astro 81, .mjs 35, .ts 11

### Next.js

- Cold build (median of 3): **68.32 s** (best 63.48 s, worst 96.00 s)
- Per page: 68 ms
- Initial JS: 631.7 KB
- Initial CSS: 2.8 KB
- Total JS (incl. lazy): 918.3 KB
- Total CSS: 2.8 KB
- Sample HTML size (1 page): 532.6 KB
- Total output on disk: 1974.28 MB
- Source files: 10, LOC: 505
- LOC by extension: .tsx 274, .css 162, .mjs 47, .ts 22

### SvelteKit

- Cold build (median of 3): **35.23 s** (best 24.61 s, worst 40.87 s)
- Per page: 35 ms
- Initial JS: 84.2 KB
- Initial CSS: 3.5 KB
- Total JS (incl. lazy): 249.6 KB
- Total CSS: 3.5 KB
- Sample HTML size (1 page): 141.5 KB
- Total output on disk: 178.34 MB
- Source files: 10, LOC: 447
- LOC by extension: .svelte 211, .css 162, .mjs 29, .ts 27, .js 18
