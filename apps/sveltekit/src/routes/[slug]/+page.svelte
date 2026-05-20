<script lang="ts">
  import type { PageData } from './$types';
  import { withBase } from '@bench/data/base-path';
  import CartIsland from './CartIsland.svelte';

  interface Props {
    data: PageData;
  }
  let { data }: Props = $props();
  const { restaurant } = data;

  const formatPrice = (cents: number) => `\u00a3${(cents / 100).toFixed(2)}`;
</script>

<svelte:head>
  <title>{restaurant.name} - menu</title>
</svelte:head>

<header class="site-header">
  <img
    class="site-header__image"
    src={withBase(restaurant.headerImage)}
    alt=""
    width="1280"
    height="320"
  />
  <div class="site-header__overlay">
    <h1 class="site-header__title">{restaurant.name}</h1>
    <p class="site-header__tagline">{restaurant.tagline}</p>
  </div>
</header>

<main class="menu-layout">
  <section class="menu" aria-label="Menu">
    {#each restaurant.categories as category (category.id)}
      <section class="category" aria-labelledby={`cat-${category.id}`}>
        <h2 id={`cat-${category.id}`} class="category__title">{category.name}</h2>
        <ul class="category__items">
          {#each category.items as item (item.id)}
            <li>
              <button
                type="button"
                class="item"
                data-item-id={item.id}
                aria-label={`Add ${item.name} to your basket`}
              >
                <span class="item__name">{item.name}</span>
                <span class="item__description">{item.description}</span>
                <span class="item__price">{formatPrice(item.price)}</span>
              </button>
            </li>
          {/each}
        </ul>
      </section>
    {/each}
  </section>

  <CartIsland {restaurant} />
</main>
