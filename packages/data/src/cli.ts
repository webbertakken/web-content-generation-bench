import { writeFileSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { generate } from './generate.js';

interface CliArgs {
  count: number;
  seed: string;
  out: string;
}

const parseArgs = (argv: readonly string[]): CliArgs => {
  let count = 1_000;
  let seed = 'bench-default';
  let out = 'data.json';
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--count') {
      const value = argv[i + 1];
      if (!value) throw new Error('--count requires a value');
      count = Number(value);
      if (!Number.isFinite(count) || count <= 0) {
        throw new Error(`--count must be a positive integer, got "${value}"`);
      }
      i += 1;
    } else if (arg === '--seed') {
      const value = argv[i + 1];
      if (!value) throw new Error('--seed requires a value');
      seed = value;
      i += 1;
    } else if (arg === '--out') {
      const value = argv[i + 1];
      if (!value) throw new Error('--out requires a value');
      out = value;
      i += 1;
    } else if (arg === '--help' || arg === '-h') {
      console.log('Usage: tsx src/cli.ts [--count N] [--seed STRING] [--out PATH]');
      process.exit(0);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }
  return { count, seed, out };
};

const main = (): void => {
  const args = parseArgs(process.argv.slice(2));
  const startedAt = performance.now();
  const dataset = generate({ count: args.count, seed: args.seed });
  const outPath = resolve(process.cwd(), args.out);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, JSON.stringify(dataset));
  const ms = Math.round(performance.now() - startedAt);
  const totalItems = dataset.restaurants.reduce(
    (sum, r) => sum + r.categories.reduce((s, c) => s + c.items.length, 0),
    0,
  );
  console.log(
    `Generated ${dataset.restaurants.length} restaurants (${totalItems} items) in ${ms} ms -> ${outPath}`,
  );
};

main();
