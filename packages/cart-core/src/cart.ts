import type { Item } from '@bench/data';

/**
 * A single line in the cart. The identity is (itemId, sauceId), so the same
 * item ordered with two different sauces becomes two lines.
 */
export interface CartLine {
  itemId: string;
  sauceId: string;
  /** Cached at add-time so the line is self-describing without re-looking up the item. */
  itemName: string;
  itemPriceCents: number;
  sauceName: string;
  sauceSurchargeCents: number;
  quantity: number;
}

export interface Cart {
  restaurantId: string;
  lines: CartLine[];
}

export interface CheckoutPayload {
  restaurantId: string;
  lines: { itemId: string; sauceId: string; quantity: number }[];
  totalCents: number;
}

export const createEmptyCart = (restaurantId: string): Cart => ({
  restaurantId,
  lines: [],
});

const findLineIndex = (cart: Cart, itemId: string, sauceId: string): number =>
  cart.lines.findIndex((l) => l.itemId === itemId && l.sauceId === sauceId);

const lineUnitPriceCents = (line: CartLine): number =>
  line.itemPriceCents + line.sauceSurchargeCents;

export const addLine = (cart: Cart, item: Item, sauceId: string): Cart => {
  const sauce = item.sauces.find((s) => s.id === sauceId);
  if (!sauce) {
    throw new Error(
      `Sauce "${sauceId}" is not available for item "${item.id}". Available: ${item.sauces.map((s) => s.id).join(', ')}`,
    );
  }

  const existingIndex = findLineIndex(cart, item.id, sauceId);
  if (existingIndex !== -1) {
    return {
      ...cart,
      lines: cart.lines.map((line, i) =>
        i === existingIndex ? { ...line, quantity: line.quantity + 1 } : line,
      ),
    };
  }

  const newLine: CartLine = {
    itemId: item.id,
    sauceId: sauce.id,
    itemName: item.name,
    itemPriceCents: item.price,
    sauceName: sauce.name,
    sauceSurchargeCents: sauce.surcharge,
    quantity: 1,
  };
  return { ...cart, lines: [...cart.lines, newLine] };
};

export const setLineQuantity = (
  cart: Cart,
  itemId: string,
  sauceId: string,
  quantity: number,
): Cart => {
  if (quantity < 0 || !Number.isFinite(quantity)) {
    throw new Error(`Quantity must be a non-negative finite number, got ${quantity}`);
  }
  const index = findLineIndex(cart, itemId, sauceId);
  if (index === -1) return cart;
  if (quantity === 0) {
    return { ...cart, lines: cart.lines.filter((_, i) => i !== index) };
  }
  return {
    ...cart,
    lines: cart.lines.map((line, i) => (i === index ? { ...line, quantity } : line)),
  };
};

export const removeLine = (cart: Cart, itemId: string, sauceId: string): Cart => {
  const index = findLineIndex(cart, itemId, sauceId);
  if (index === -1) return cart;
  return { ...cart, lines: cart.lines.filter((_, i) => i !== index) };
};

export const cartTotalCents = (cart: Cart): number =>
  cart.lines.reduce((sum, line) => sum + lineUnitPriceCents(line) * line.quantity, 0);

export const cartItemCount = (cart: Cart): number =>
  cart.lines.reduce((sum, line) => sum + line.quantity, 0);

export const serialiseForCheckout = (cart: Cart): CheckoutPayload => ({
  restaurantId: cart.restaurantId,
  lines: cart.lines.map(({ itemId, sauceId, quantity }) => ({ itemId, sauceId, quantity })),
  totalCents: cartTotalCents(cart),
});
