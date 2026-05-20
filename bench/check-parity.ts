#!/usr/bin/env tsx
/**
 * Lightweight structural-parity check.
 *
 * Verifies that every app's output for the canonical "first restaurant"
 * contains the same logical DOM: the right number of item buttons, the right
 * number of category sections, a cart placeholder, and the restaurant name.
 *
 * Cheaper than Playwright and catches the bugs that matter (missing element,
 * wrong count) for the benchmark's apples-to-apples premise.
 */
import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { APPS, REPO_ROOT, findSampleHtml } from './lib/apps';
import { loadDataset } from '@bench/data/load';

const datasetPath = resolve(REPO_ROOT, 'packages', 'data', 'data.json');
if (!existsSync(datasetPath)) {
  console.error(`No dataset at ${datasetPath}. Run "yarn data" first.`);
  process.exit(1);
}
const dataset = loadDataset(datasetPath);
const sample = dataset.restaurants[0];
if (!sample) {
  console.error('Dataset has no restaurants.');
  process.exit(1);
}
const expectedItemCount = sample.categories.reduce((sum, c) => sum + c.items.length, 0);
const expectedCategoryCount = sample.categories.length;

interface ParityCheck {
  app: string;
  ok: boolean;
  issues: string[];
}

const count = (haystack: string, needle: RegExp): number => (haystack.match(needle) ?? []).length;

const checks: ParityCheck[] = APPS.map((app) => {
  const issues: string[] = [];
  const sampleHtml = findSampleHtml(app.outDir, sample.slug);
  const altSampleHtml = resolve(app.outDir, `${sample.slug}.html`);
  const file = existsSync(sampleHtml) ? sampleHtml : altSampleHtml;
  if (!existsSync(file)) {
    return { app: app.label, ok: false, issues: [`No HTML output found at ${file}`] };
  }
  const html = readFileSync(file, 'utf8');

  if (!html.includes(sample.name)) issues.push(`Restaurant name "${sample.name}" not in output`);
  if (!html.includes(sample.tagline)) issues.push(`Tagline missing`);
  const itemButtons = count(html, /<button[^>]+class=["'][^"']*\bitem\b[^"']*["']/g);
  if (itemButtons !== expectedItemCount) {
    issues.push(`expected ${expectedItemCount} item buttons, got ${itemButtons}`);
  }
  const categories = count(html, /<section[^>]+class=["'][^"']*\bcategory\b[^"']*["']/g);
  if (categories !== expectedCategoryCount) {
    issues.push(`expected ${expectedCategoryCount} categories, got ${categories}`);
  }
  if (!/<aside[^>]+class=["'][^"']*\bcart\b[^"']*["']/.test(html)) {
    issues.push('cart aside missing');
  }

  return { app: app.label, ok: issues.length === 0, issues };
});

console.log(`Structural parity check (sample: "${sample.name}", slug: ${sample.slug})`);
console.log(`  Expected: ${expectedCategoryCount} categories, ${expectedItemCount} item buttons`);
console.log('');
let allOk = true;
for (const c of checks) {
  if (c.ok) {
    console.log(`  ✓ ${c.app}`);
  } else {
    allOk = false;
    console.log(`  ✗ ${c.app}`);
    for (const issue of c.issues) console.log(`      ${issue}`);
  }
}
if (!allOk) process.exit(2);
