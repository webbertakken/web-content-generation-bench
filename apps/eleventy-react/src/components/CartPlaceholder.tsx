/**
 * Static placeholder rendered into the HTML by the server. The cart island
 * (loaded via @11ty/is-land) replaces this with a hydrated React component.
 *
 * The placeholder is itself semantic and keyboard-reachable, so even before
 * hydration completes the user sees a real, accessible aside.
 */
export const CartPlaceholder = () => (
  <aside id="cart-root" className="cart" aria-label="Your basket">
    <h2 className="cart__title">Your basket</h2>
    <p className="cart__empty">Tap an item to add it to your basket.</p>
  </aside>
);
