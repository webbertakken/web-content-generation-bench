import { createRoot } from 'react-dom/client';
import type { Restaurant } from '@bench/data';
import { Cart } from '../components/Cart.js';

// Side-effect imports: registering the Pie custom elements.
import '@justeattakeaway/pie-modal';
import '@justeattakeaway/pie-button';
import '@justeattakeaway/pie-radio-group';
import '@justeattakeaway/pie-radio';

const dataEl = document.getElementById('restaurant-data');
const mount = document.getElementById('cart-root');

if (!dataEl || !mount) {
  console.error('[cart-island] missing #restaurant-data or #cart-root');
} else {
  const restaurant = JSON.parse(dataEl.textContent ?? '{}') as Restaurant;
  // Replace the placeholder with a React-controlled aside.
  const root = document.createElement('div');
  root.id = 'cart-root-mount';
  mount.replaceWith(root);
  createRoot(root).render(<Cart restaurant={restaurant} />);
}
