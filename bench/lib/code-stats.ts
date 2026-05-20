import { readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';
import type { CodeStats } from './types';

const SOURCE_EXTS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.mjs',
  '.cjs',
  '.jsx',
  '.astro',
  '.svelte',
  '.css',
]);
const IGNORE_DIRS = new Set([
  'node_modules',
  'dist',
  'build',
  'build-tmp',
  '_site',
  '.next',
  '.svelte-kit',
  '.astro',
  '.eleventy-cache',
  'out',
  '.turbo',
]);

const isMeaningfulLine = (line: string): boolean => {
  const trimmed = line.trim();
  if (trimmed.length === 0) return false;
  if (
    trimmed === '{' ||
    trimmed === '}' ||
    trimmed === '});' ||
    trimmed === ');' ||
    trimmed === ','
  ) {
    return false;
  }
  if (trimmed.startsWith('//')) return false;
  if (trimmed.startsWith('*')) return false;
  if (trimmed.startsWith('/*')) return false;
  return true;
};

/**
 * Walks `root` and counts files + meaningful source lines. We deliberately
 * use a simple LOC heuristic (non-blank, non-trivial lines) rather than
 * full AST analysis: it is consistent across languages without per-language
 * tooling and is what the brief asks for.
 */
export const collectCodeStats = (root: string): CodeStats => {
  const byExt: Record<string, { files: number; loc: number }> = {};
  let totalFiles = 0;
  let totalLoc = 0;

  const visit = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir);
    } catch {
      return;
    }
    for (const entry of entries) {
      if (IGNORE_DIRS.has(entry)) continue;
      const fullPath = join(dir, entry);
      let stat;
      try {
        stat = statSync(fullPath);
      } catch {
        continue;
      }
      if (stat.isDirectory()) {
        visit(fullPath);
        continue;
      }
      const ext = extname(entry);
      if (!SOURCE_EXTS.has(ext)) continue;
      let content;
      try {
        content = readFileSync(fullPath, 'utf8');
      } catch {
        continue;
      }
      const lines = content.split(/\r?\n/);
      const loc = lines.filter(isMeaningfulLine).length;
      totalFiles += 1;
      totalLoc += loc;
      byExt[ext] = byExt[ext] ?? { files: 0, loc: 0 };
      byExt[ext].files += 1;
      byExt[ext].loc += loc;
    }
  };

  visit(root);
  return { files: totalFiles, loc: totalLoc, byExt };
};

/** Helper for printing a tree-relative path in logs. */
export const fromRoot = (root: string, p: string): string => relative(root, p);
