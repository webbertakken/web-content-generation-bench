<script lang="ts">
  import { onMount } from 'svelte';
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
  import SauceModal from './SauceModal.svelte';

  interface Props {
    restaurant: Restaurant;
  }
  let { restaurant }: Props = $props();

  let cart: CartState = $state(createEmptyCart(restaurant.id));
  let activeItem: Item | null = $state(null);
  let pieReady = $state(false);

  // Item lookup for click delegation.
  const itemLookup = new Map<string, Item>();
  for (const category of restaurant.categories) {
    for (const item of category.items) itemLookup.set(item.id, item);
  }

  const formatPrice = (cents: number) => `\u00a3${(cents / 100).toFixed(2)}`;

  const totalCents = $derived(cartTotalCents(cart));
  const itemCount = $derived(cartItemCount(cart));

  const handleSauceChosen = (sauceId: string) => {
    if (!activeItem) return;
    cart = addLine(cart, activeItem, sauceId);
    activeItem = null;
  };

  const handleSendOrder = () => {
    console.info('order payload', serialiseForCheckout(cart));
  };

  const updateQty = (itemId: string, sauceId: string, qty: number) => {
    cart = setLineQuantity(cart, itemId, sauceId, qty);
  };

  // onMount's callback must return either a cleanup function or undefined,
  // not a Promise that resolves to a cleanup function. We register the click
  // handler synchronously and kick off the Pie imports separately.
  onMount(() => {
    const onClick = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      const button = target?.closest('button.item') as HTMLButtonElement | null;
      if (!button) return;
      const itemId = button.dataset['itemId'];
      if (!itemId) return;
      const item = itemLookup.get(itemId);
      if (!item) return;
      activeItem = item;
    };
    document.addEventListener('click', onClick);

    Promise.all([
      import('@justeattakeaway/pie-modal'),
      import('@justeattakeaway/pie-button'),
      import('@justeattakeaway/pie-radio-group'),
      import('@justeattakeaway/pie-radio'),
    ]).then(() => {
      pieReady = true;
    });

    return () => {
      document.removeEventListener('click', onClick);
    };
  });
</script>

<aside class="cart" aria-label="Your basket">
  <h2 class="cart__title">Your basket</h2>
  {#if cart.lines.length === 0}
    <p class="cart__empty">Tap an item to add it to your basket.</p>
  {:else}
    <ul class="cart__lines">
      {#each cart.lines as line (line.itemId + '-' + line.sauceId)}
        <li class="cart__line">
          <div class="cart__line-info">
            <span class="cart__line-name">{line.itemName}</span>
            <span class="cart__line-sauce">with {line.sauceName}</span>
          </div>
          <div class="cart__line-controls">
            <button
              type="button"
              aria-label={`Decrease ${line.itemName} quantity`}
              onclick={() => updateQty(line.itemId, line.sauceId, line.quantity - 1)}
            >-</button>
            <span aria-live="polite">{line.quantity}</span>
            <button
              type="button"
              aria-label={`Increase ${line.itemName} quantity`}
              onclick={() => updateQty(line.itemId, line.sauceId, line.quantity + 1)}
            >+</button>
          </div>
          <span class="cart__line-price">
            {formatPrice((line.itemPriceCents + line.sauceSurchargeCents) * line.quantity)}
          </span>
        </li>
      {/each}
    </ul>
    <div class="cart__summary">
      <p>
        Total ({itemCount} {itemCount === 1 ? 'item' : 'items'}):
        <strong>{formatPrice(totalCents)}</strong>
      </p>
      {#if pieReady}
        <pie-button variant="primary" onclick={handleSendOrder}>Send order</pie-button>
      {:else}
        <button type="button" onclick={handleSendOrder}>Send order</button>
      {/if}
    </div>
  {/if}
</aside>

{#if pieReady}
  <SauceModal item={activeItem} onChoose={handleSauceChosen} onCancel={() => (activeItem = null)} />
{/if}
