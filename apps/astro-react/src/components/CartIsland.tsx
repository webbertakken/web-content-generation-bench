import { useState, useEffect, useCallback } from 'react';
import type { Item, Restaurant } from '@bench/data';
import {
  type Cart as CartState,
  createEmptyCart,
  addLine,
  setLineQuantity,
  cartTotalCents,
  cartItemCount,
  serialiseForCheckout,
} from '@bench/cart-core';
import { SauceModal } from './SauceModal.js';

// Side-effect imports: register Pie web components when this island hydrates.
import '@justeattakeaway/pie-modal';
import '@justeattakeaway/pie-button';
import '@justeattakeaway/pie-radio-group';
import '@justeattakeaway/pie-radio';

const formatPrice = (cents: number): string => `\u00a3${(cents / 100).toFixed(2)}`;

interface Props {
  restaurant: Restaurant;
}

export default function CartIsland({ restaurant }: Props) {
  const [cart, setCart] = useState<CartState>(() => createEmptyCart(restaurant.id));
  const [activeItem, setActiveItem] = useState<Item | null>(null);

  const itemLookup = new Map<string, Item>();
  for (const category of restaurant.categories) {
    for (const item of category.items) itemLookup.set(item.id, item);
  }

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button.item') as HTMLButtonElement | null;
      if (!button) return;
      const itemId = button.dataset['itemId'];
      if (!itemId) return;
      const item = itemLookup.get(itemId);
      if (!item) return;
      setActiveItem(item);
    };
    document.addEventListener('click', onClick);
    return () => document.removeEventListener('click', onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurant.id]);

  const handleSauceChosen = useCallback(
    (sauceId: string) => {
      if (!activeItem) return;
      setCart((prev) => addLine(prev, activeItem, sauceId));
      setActiveItem(null);
    },
    [activeItem],
  );

  const handleSendOrder = () => {
    console.info('order payload', serialiseForCheckout(cart));
  };

  const updateQty = (itemId: string, sauceId: string, qty: number) => {
    setCart((prev) => setLineQuantity(prev, itemId, sauceId, qty));
  };

  const totalCents = cartTotalCents(cart);
  const itemCount = cartItemCount(cart);

  return (
    <>
      <aside className="cart" aria-label="Your basket">
        <h2 className="cart__title">Your basket</h2>
        {cart.lines.length === 0 ? (
          <p className="cart__empty">Tap an item to add it to your basket.</p>
        ) : (
          <>
            <ul className="cart__lines">
              {cart.lines.map((line) => (
                <li key={`${line.itemId}-${line.sauceId}`} className="cart__line">
                  <div className="cart__line-info">
                    <span className="cart__line-name">{line.itemName}</span>
                    <span className="cart__line-sauce">with {line.sauceName}</span>
                  </div>
                  <div className="cart__line-controls">
                    <button
                      type="button"
                      aria-label={`Decrease ${line.itemName} quantity`}
                      onClick={() => updateQty(line.itemId, line.sauceId, line.quantity - 1)}
                    >
                      -
                    </button>
                    <span aria-live="polite">{line.quantity}</span>
                    <button
                      type="button"
                      aria-label={`Increase ${line.itemName} quantity`}
                      onClick={() => updateQty(line.itemId, line.sauceId, line.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <span className="cart__line-price">
                    {formatPrice((line.itemPriceCents + line.sauceSurchargeCents) * line.quantity)}
                  </span>
                </li>
              ))}
            </ul>
            <div className="cart__summary">
              <p>
                Total ({itemCount} {itemCount === 1 ? 'item' : 'items'}):{' '}
                <strong>{formatPrice(totalCents)}</strong>
              </p>
              <pie-button variant="primary" onClick={handleSendOrder}>
                Send order
              </pie-button>
            </div>
          </>
        )}
      </aside>

      <SauceModal
        item={activeItem}
        onChoose={handleSauceChosen}
        onCancel={() => setActiveItem(null)}
      />
    </>
  );
}
