/**
 * Domain types for the benchmark dataset.
 *
 * Every framework consumes the same `Restaurant[]` array, ensuring the
 * comparison measures the framework rather than data differences.
 *
 * Money is expressed in integer cents (avoids floating-point drift across
 * frameworks during cart total calculations).
 */

export type Money = number;

export interface Sauce {
  id: string;
  name: string;
  /** Extra cost in cents (0 for "no extra charge"). */
  surcharge: Money;
}

export interface Item {
  id: string;
  name: string;
  description: string;
  price: Money;
  /** Available sauces. At least one entry; the modal forces a selection. */
  sauces: Sauce[];
}

export interface Category {
  id: string;
  name: string;
  items: Item[];
}

export interface Restaurant {
  id: string;
  /** URL-safe identifier used for static page paths. */
  slug: string;
  name: string;
  /** Short tagline shown under the header. */
  tagline: string;
  /** Relative path to the header image, e.g. `/images/header-01.jpg`. */
  headerImage: string;
  categories: Category[];
}

export interface Dataset {
  /** ISO-8601 timestamp at which the dataset was generated. */
  generatedAt: string;
  /** Seed used by the deterministic generator. */
  seed: string;
  restaurants: Restaurant[];
}

/** Tunable knobs for the generator. All optional with sensible defaults. */
export interface GenerateOptions {
  /** Number of restaurants to emit. */
  count: number;
  /** PRNG seed. Default `'bench-default'`. */
  seed?: string;
  /** Fixed number of categories per restaurant. Default 5. */
  categoriesPerRestaurant?: number;
  /** Inclusive min items per category. Default 5. */
  minItemsPerCategory?: number;
  /** Inclusive max items per category. Default 200. */
  maxItemsPerCategory?: number;
  /** Number of available header images to cycle through. Default 8. */
  headerImageCount?: number;
}
