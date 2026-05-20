import { error } from '@sveltejs/kit';
import { resolve } from 'node:path';
import { loadDataset } from '@bench/data/load';
import type { Restaurant } from '@bench/data';
import type { EntryGenerator, PageServerLoad } from './$types';

let cached: Restaurant[] | undefined;

const allRestaurants = (): Restaurant[] => {
  if (cached) return cached;
  const datasetPath = resolve(process.cwd(), '..', '..', 'packages', 'data', 'data.json');
  cached = loadDataset(datasetPath).restaurants;
  return cached;
};

export const load: PageServerLoad = ({ params }) => {
  const restaurant = allRestaurants().find((r) => r.slug === params.slug);
  if (!restaurant) {
    error(404, `No restaurant with slug "${params.slug}"`);
  }
  return { restaurant };
};

// Tell SvelteKit which paths to prerender.
export const entries: EntryGenerator = () => allRestaurants().map((r) => ({ slug: r.slug }));
