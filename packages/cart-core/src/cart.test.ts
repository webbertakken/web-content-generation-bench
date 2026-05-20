import { describe, it, expect } from 'vitest';
import type { Item, Sauce } from '@bench/data';
import {
  createEmptyCart,
  addLine,
  removeLine,
  setLineQuantity,
  cartTotalCents,
  cartItemCount,
  serialiseForCheckout,
} from './cart';

const sauce = (id: string, name: string, surcharge = 0): Sauce => ({ id, name, surcharge });

const item = (overrides: Partial<Item> = {}): Item => ({
  id: 'item-1',
  name: 'Test burger',
  description: 'A burger.',
  price: 1000,
  sauces: [sauce('mayo', 'Mayo'), sauce('bbq', 'BBQ', 50)],
  ...overrides,
});

describe('createEmptyCart', () => {
  it('returns a cart with no lines', () => {
    const cart = createEmptyCart('resto-1');
    expect(cart.restaurantId).toBe('resto-1');
    expect(cart.lines).toEqual([]);
  });
});

describe('addLine', () => {
  it('adds a line with the chosen sauce and default quantity 1', () => {
    const cart = createEmptyCart('r');
    const next = addLine(cart, item(), 'mayo');
    expect(next.lines).toHaveLength(1);
    expect(next.lines[0]?.itemId).toBe('item-1');
    expect(next.lines[0]?.sauceId).toBe('mayo');
    expect(next.lines[0]?.quantity).toBe(1);
  });

  it('merges quantities when adding the same item + sauce combo twice', () => {
    let cart = createEmptyCart('r');
    cart = addLine(cart, item(), 'mayo');
    cart = addLine(cart, item(), 'mayo');
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.quantity).toBe(2);
  });

  it('keeps separate lines when the same item is added with different sauces', () => {
    let cart = createEmptyCart('r');
    cart = addLine(cart, item(), 'mayo');
    cart = addLine(cart, item(), 'bbq');
    expect(cart.lines).toHaveLength(2);
  });

  it('does not mutate the input cart', () => {
    const cart = createEmptyCart('r');
    const next = addLine(cart, item(), 'mayo');
    expect(cart.lines).toEqual([]);
    expect(next).not.toBe(cart);
  });

  it('throws when the chosen sauce id is not on the item', () => {
    const cart = createEmptyCart('r');
    expect(() => addLine(cart, item(), 'no-such-sauce')).toThrow();
  });
});

describe('setLineQuantity', () => {
  it('updates the quantity of the matching line', () => {
    let cart = createEmptyCart('r');
    cart = addLine(cart, item(), 'mayo');
    cart = setLineQuantity(cart, 'item-1', 'mayo', 5);
    expect(cart.lines[0]?.quantity).toBe(5);
  });

  it('removes the line when quantity is set to 0', () => {
    let cart = createEmptyCart('r');
    cart = addLine(cart, item(), 'mayo');
    cart = setLineQuantity(cart, 'item-1', 'mayo', 0);
    expect(cart.lines).toHaveLength(0);
  });

  it('throws on negative quantity', () => {
    let cart = createEmptyCart('r');
    cart = addLine(cart, item(), 'mayo');
    expect(() => setLineQuantity(cart, 'item-1', 'mayo', -1)).toThrow();
  });

  it('is a no-op when the line does not exist', () => {
    const cart = createEmptyCart('r');
    const next = setLineQuantity(cart, 'item-1', 'mayo', 3);
    expect(next.lines).toEqual([]);
  });
});

describe('removeLine', () => {
  it('removes the matching line and leaves others alone', () => {
    let cart = createEmptyCart('r');
    cart = addLine(cart, item(), 'mayo');
    cart = addLine(cart, item(), 'bbq');
    cart = removeLine(cart, 'item-1', 'mayo');
    expect(cart.lines).toHaveLength(1);
    expect(cart.lines[0]?.sauceId).toBe('bbq');
  });

  it('is a no-op for a non-existent line', () => {
    const cart = createEmptyCart('r');
    const next = removeLine(cart, 'nope', 'nope');
    expect(next.lines).toEqual([]);
  });
});

describe('cartTotalCents', () => {
  it('returns 0 for an empty cart', () => {
    expect(cartTotalCents(createEmptyCart('r'))).toBe(0);
  });

  it('sums item price + sauce surcharge times quantity', () => {
    let cart = createEmptyCart('r');
    cart = addLine(cart, item({ price: 1000 }), 'bbq'); // 1000 + 50 = 1050
    cart = setLineQuantity(cart, 'item-1', 'bbq', 3);
    expect(cartTotalCents(cart)).toBe(3150);
  });

  it('handles mixed lines correctly', () => {
    let cart = createEmptyCart('r');
    cart = addLine(cart, item({ id: 'a', price: 500 }), 'mayo'); // 500
    cart = addLine(cart, item({ id: 'b', price: 800 }), 'bbq'); // 850
    cart = setLineQuantity(cart, 'b', 'bbq', 2); // 1700
    expect(cartTotalCents(cart)).toBe(2200);
  });
});

describe('cartItemCount', () => {
  it('counts total units across lines', () => {
    let cart = createEmptyCart('r');
    cart = addLine(cart, item({ id: 'a' }), 'mayo');
    cart = addLine(cart, item({ id: 'b' }), 'mayo');
    cart = setLineQuantity(cart, 'b', 'mayo', 3);
    expect(cartItemCount(cart)).toBe(4);
  });
});

describe('serialiseForCheckout', () => {
  it('produces a stable JSON shape suitable for POSTing', () => {
    let cart = createEmptyCart('resto-x');
    cart = addLine(cart, item({ id: 'a', price: 500 }), 'mayo');
    cart = setLineQuantity(cart, 'a', 'mayo', 2);
    const payload = serialiseForCheckout(cart);
    expect(payload).toEqual({
      restaurantId: 'resto-x',
      lines: [{ itemId: 'a', sauceId: 'mayo', quantity: 2 }],
      totalCents: 1000,
    });
  });

  it('round-trips through JSON.stringify without loss', () => {
    let cart = createEmptyCart('resto-x');
    cart = addLine(cart, item(), 'bbq');
    const payload = serialiseForCheckout(cart);
    expect(JSON.parse(JSON.stringify(payload))).toEqual(payload);
  });
});
