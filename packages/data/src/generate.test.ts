import { describe, it, expect } from 'vitest';
import { generate } from './generate';

describe('generate', () => {
  it('produces exactly the requested number of restaurants', () => {
    const dataset = generate({ count: 7 });
    expect(dataset.restaurants).toHaveLength(7);
  });

  it('is deterministic for a given seed', () => {
    const a = generate({ count: 10, seed: 'identical' });
    const b = generate({ count: 10, seed: 'identical' });
    // Strip the timestamp before comparing; it intentionally varies.
    const stripTime = (d: ReturnType<typeof generate>) => ({ ...d, generatedAt: '' });
    expect(stripTime(a)).toEqual(stripTime(b));
  });

  it('produces different output for different seeds', () => {
    const a = generate({ count: 5, seed: 'alpha' });
    const b = generate({ count: 5, seed: 'beta' });
    expect(a.restaurants).not.toEqual(b.restaurants);
  });

  it('gives each restaurant exactly 5 categories by default', () => {
    const dataset = generate({ count: 3 });
    for (const restaurant of dataset.restaurants) {
      expect(restaurant.categories).toHaveLength(5);
    }
  });

  it('respects custom category count', () => {
    const dataset = generate({ count: 2, categoriesPerRestaurant: 3 });
    for (const restaurant of dataset.restaurants) {
      expect(restaurant.categories).toHaveLength(3);
    }
  });

  it('keeps items per category within the configured bounds', () => {
    const dataset = generate({
      count: 20,
      seed: 'bounds',
      minItemsPerCategory: 5,
      maxItemsPerCategory: 200,
    });
    for (const restaurant of dataset.restaurants) {
      for (const category of restaurant.categories) {
        expect(category.items.length).toBeGreaterThanOrEqual(5);
        expect(category.items.length).toBeLessThanOrEqual(200);
      }
    }
  });

  it('gives every item at least one sauce so the modal always has a choice', () => {
    const dataset = generate({ count: 5, seed: 'sauces' });
    for (const restaurant of dataset.restaurants) {
      for (const category of restaurant.categories) {
        for (const item of category.items) {
          expect(item.sauces.length).toBeGreaterThanOrEqual(1);
        }
      }
    }
  });

  it('emits unique restaurant slugs (so static paths do not collide)', () => {
    const dataset = generate({ count: 200, seed: 'slugs' });
    const slugs = new Set(dataset.restaurants.map((r) => r.slug));
    expect(slugs.size).toBe(dataset.restaurants.length);
  });

  it('emits unique item ids per restaurant', () => {
    const dataset = generate({ count: 10, seed: 'item-ids' });
    for (const restaurant of dataset.restaurants) {
      const ids = restaurant.categories.flatMap((c) => c.items.map((i) => i.id));
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('uses positive integer prices (cents)', () => {
    const dataset = generate({ count: 3, seed: 'prices' });
    for (const restaurant of dataset.restaurants) {
      for (const category of restaurant.categories) {
        for (const item of category.items) {
          expect(Number.isInteger(item.price)).toBe(true);
          expect(item.price).toBeGreaterThan(0);
        }
      }
    }
  });

  it('cycles header images through the configured pool', () => {
    const dataset = generate({ count: 50, seed: 'images', headerImageCount: 4 });
    const usedImages = new Set(dataset.restaurants.map((r) => r.headerImage));
    expect(usedImages.size).toBeLessThanOrEqual(4);
    expect(usedImages.size).toBeGreaterThan(0);
  });

  it('throws on non-positive count', () => {
    expect(() => generate({ count: 0 })).toThrow();
    expect(() => generate({ count: -1 })).toThrow();
  });

  it('throws when min > max items per category', () => {
    expect(() =>
      generate({ count: 1, minItemsPerCategory: 50, maxItemsPerCategory: 10 }),
    ).toThrow();
  });

  it('records the seed and an ISO timestamp', () => {
    const dataset = generate({ count: 1, seed: 'meta-check' });
    expect(dataset.seed).toBe('meta-check');
    expect(() => new Date(dataset.generatedAt).toISOString()).not.toThrow();
  });
});
