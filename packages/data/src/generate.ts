import seedrandom from 'seedrandom';
import type { Category, Dataset, GenerateOptions, Item, Restaurant, Sauce } from './types.js';

const CATEGORY_NAMES = [
  'Starters',
  'Mains',
  'Sides',
  'Pizzas',
  'Burgers',
  'Bowls',
  'Desserts',
  'Drinks',
  'Specials',
  'Kids menu',
];

const ITEM_ADJECTIVES = [
  'Smoky',
  'Crispy',
  'Spicy',
  'Sweet',
  'Tangy',
  'Creamy',
  'Zesty',
  'Charred',
  'Roasted',
  'Grilled',
  'Fiery',
  'Buttery',
  'Honey-glazed',
  'Loaded',
  'Double',
];

const ITEM_NOUNS = [
  'Chicken wings',
  'Beef burger',
  'Margherita pizza',
  'Caesar salad',
  'Falafel wrap',
  'Halloumi fries',
  'Pad thai',
  'Vegan bowl',
  'Sushi platter',
  'Lamb kebab',
  'Mac and cheese',
  'Fish tacos',
  'Pulled pork sandwich',
  'Veggie burrito',
  'Tom yum soup',
];

const TAGLINES = [
  'Fresh, fast, and full of flavour',
  'Comfort food, reimagined',
  'Where every bite tells a story',
  'Bold flavours, local produce',
  'Crafted with love since forever',
  'Your neighbourhood favourite',
  'Late night cravings sorted',
  'Eat well, feel better',
];

const RESTAURANT_PREFIXES = [
  'The',
  "Mama's",
  "Papa's",
  'Big',
  'Little',
  'Royal',
  'Golden',
  'Urban',
  'Wild',
  'Happy',
];

const RESTAURANT_CORES = [
  'Kitchen',
  'Bistro',
  'Diner',
  'Grill',
  'Eatery',
  'House',
  'Spot',
  'Joint',
  'Table',
  'Yard',
];

const SAUCE_NAMES = [
  'Garlic mayo',
  'BBQ',
  'Sriracha',
  'Sweet chilli',
  'Honey mustard',
  'Curry ketchup',
  'Aioli',
  'Tahini',
  'Tartare',
  'Peri-peri',
  'Buffalo',
  'Ranch',
];

type Rng = () => number;

const pick = <T>(rng: Rng, list: readonly T[]): T => {
  const index = Math.floor(rng() * list.length);
  // Bounded above by list.length - 1, so the cast is safe when the list is non-empty.
  return list[index] as T;
};

const intBetween = (rng: Rng, min: number, max: number): number =>
  Math.floor(rng() * (max - min + 1)) + min;

const slugify = (input: string): string =>
  input
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildSauces = (rng: Rng): Sauce[] => {
  const count = intBetween(rng, 2, 4);
  const chosen = new Set<string>();
  const sauces: Sauce[] = [];
  while (sauces.length < count && chosen.size < SAUCE_NAMES.length) {
    const name = pick(rng, SAUCE_NAMES);
    if (chosen.has(name)) continue;
    chosen.add(name);
    sauces.push({
      id: `${slugify(name)}-${sauces.length}`,
      name,
      surcharge: rng() < 0.3 ? intBetween(rng, 25, 150) : 0,
    });
  }
  return sauces;
};

const buildItem = (rng: Rng, restaurantSlug: string, categoryId: string, index: number): Item => {
  const adjective = pick(rng, ITEM_ADJECTIVES);
  const noun = pick(rng, ITEM_NOUNS);
  const name = `${adjective} ${noun.toLowerCase()}`;
  return {
    id: `${restaurantSlug}-${categoryId}-${index}`,
    name,
    description: `${name} with a delicious twist, served fresh.`,
    price: intBetween(rng, 350, 2200),
    sauces: buildSauces(rng),
  };
};

const buildCategory = (
  rng: Rng,
  restaurantSlug: string,
  categoryName: string,
  index: number,
  minItems: number,
  maxItems: number,
): Category => {
  const id = `${slugify(categoryName)}-${index}`;
  const itemCount = intBetween(rng, minItems, maxItems);
  const items: Item[] = [];
  for (let i = 0; i < itemCount; i += 1) {
    items.push(buildItem(rng, restaurantSlug, id, i));
  }
  return { id, name: categoryName, items };
};

const buildRestaurant = (
  rng: Rng,
  index: number,
  opts: Required<
    Pick<
      GenerateOptions,
      'categoriesPerRestaurant' | 'minItemsPerCategory' | 'maxItemsPerCategory' | 'headerImageCount'
    >
  >,
): Restaurant => {
  const prefix = pick(rng, RESTAURANT_PREFIXES);
  const core = pick(rng, RESTAURANT_CORES);
  const name = `${prefix} ${core}`;
  // Suffix with the index to guarantee unique slugs even when names collide.
  const slug = `${slugify(name)}-${index}`;
  const tagline = pick(rng, TAGLINES);
  const imageNumber = (index % opts.headerImageCount) + 1;
  const headerImage = `/images/header-${String(imageNumber).padStart(2, '0')}.jpg`;

  // Pick distinct category names; fall back to indexed names if the pool is exhausted.
  const usedNames = new Set<string>();
  const categories: Category[] = [];
  for (let i = 0; i < opts.categoriesPerRestaurant; i += 1) {
    let candidate = pick(rng, CATEGORY_NAMES);
    let safety = 0;
    while (usedNames.has(candidate) && safety < CATEGORY_NAMES.length) {
      candidate = pick(rng, CATEGORY_NAMES);
      safety += 1;
    }
    if (usedNames.has(candidate)) {
      candidate = `Section ${i + 1}`;
    }
    usedNames.add(candidate);
    categories.push(
      buildCategory(rng, slug, candidate, i, opts.minItemsPerCategory, opts.maxItemsPerCategory),
    );
  }

  return { id: slug, slug, name, tagline, headerImage, categories };
};

export const generate = (options: GenerateOptions): Dataset => {
  const {
    count,
    seed = 'bench-default',
    categoriesPerRestaurant = 5,
    minItemsPerCategory = 5,
    maxItemsPerCategory = 200,
    headerImageCount = 8,
  } = options;

  if (count <= 0 || !Number.isFinite(count)) {
    throw new Error(`count must be a positive integer, got ${count}`);
  }
  if (minItemsPerCategory > maxItemsPerCategory) {
    throw new Error(
      `minItemsPerCategory (${minItemsPerCategory}) must be <= maxItemsPerCategory (${maxItemsPerCategory})`,
    );
  }
  if (minItemsPerCategory < 1) {
    throw new Error(`minItemsPerCategory must be >= 1, got ${minItemsPerCategory}`);
  }
  if (categoriesPerRestaurant < 1) {
    throw new Error(`categoriesPerRestaurant must be >= 1, got ${categoriesPerRestaurant}`);
  }
  if (headerImageCount < 1) {
    throw new Error(`headerImageCount must be >= 1, got ${headerImageCount}`);
  }

  const rng = seedrandom(seed);
  const restaurants: Restaurant[] = [];
  for (let i = 0; i < count; i += 1) {
    restaurants.push(
      buildRestaurant(rng, i, {
        categoriesPerRestaurant,
        minItemsPerCategory,
        maxItemsPerCategory,
        headerImageCount,
      }),
    );
  }

  return {
    generatedAt: new Date().toISOString(),
    seed,
    restaurants,
  };
};
