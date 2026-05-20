export interface AppConfig {
  /** Stable id, used in filenames and the report. */
  id: string;
  /** Human label for the report. */
  label: string;
  /** Workspace name passed to `yarn workspace`. */
  workspace: string;
  /** Absolute path to the app directory. */
  appDir: string;
  /** Directory that holds the final static output. */
  outDir: string;
}

export interface BundleStats {
  /** Bytes of JS likely to be on the critical path for the menu page. */
  initialJs: number;
  /** Bytes of CSS likely to be on the critical path. */
  initialCss: number;
  /** Total JS bytes across every asset in the output (incl. lazy chunks). */
  totalJs: number;
  /** Total CSS bytes across every asset in the output. */
  totalCss: number;
  /** Bytes of the rendered HTML for the canonical first restaurant. */
  htmlSampleBytes: number;
  /** Total bytes on disk across the entire output directory. */
  totalOutputBytes: number;
}

export interface CodeStats {
  /** Files counted as "source" (under apps/<id>/src or app/). */
  files: number;
  /** Total source lines (non-blank, non-trivial). */
  loc: number;
  /** Breakdown by extension. */
  byExt: Record<string, { files: number; loc: number }>;
}

export interface RunResult {
  cold: { ms: number; ok: boolean }[];
  bundle: BundleStats;
  code: CodeStats;
  scale: number;
}

export interface ReportRow {
  id: string;
  label: string;
  scale: number;
  medianMs: number;
  bestMs: number;
  worstMs: number;
  msPerPage: number;
  bundle: BundleStats;
  code: CodeStats;
}
