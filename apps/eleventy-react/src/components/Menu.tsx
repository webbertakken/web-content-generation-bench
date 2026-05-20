import type { Restaurant } from '@bench/data';
import { withBase } from '@bench/data/base-path';
import { CategorySection } from './CategorySection.js';
import { CartPlaceholder } from './CartPlaceholder.js';

interface MenuProps {
  restaurant: Restaurant;
}

export const Menu = ({ restaurant }: MenuProps) => (
  <html lang="en">
    <head>
      <meta charSet="utf-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <title>{`${restaurant.name} - menu`}</title>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
      <link
        rel="stylesheet"
        href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Inter:wght@400;500;600;700&display=swap"
      />
      <link rel="stylesheet" href={withBase('/styles/menu.css')} />
    </head>
    <body>
      <header className="site-header">
        <img
          className="site-header__image"
          src={withBase(restaurant.headerImage)}
          alt=""
          width={1280}
          height={320}
        />
        <div className="site-header__overlay">
          <h1 className="site-header__title">{restaurant.name}</h1>
          <p className="site-header__tagline">{restaurant.tagline}</p>
        </div>
      </header>

      <main className="menu-layout">
        <section className="menu" aria-label="Menu">
          {restaurant.categories.map((category) => (
            <CategorySection key={category.id} category={category} />
          ))}
        </section>

        <CartPlaceholder />
      </main>

      {/* Embedded restaurant data is consumed by the cart island on hydration. */}
      <script
        id="restaurant-data"
        type="application/json"
        // eslint-disable-next-line react/no-danger
        dangerouslySetInnerHTML={{ __html: JSON.stringify(restaurant) }}
      />

      {/* @11ty/is-land bootstrap. The cart island lazy-loads on idle. */}
      <script type="module" src={withBase('/scripts/is-land.js')} />
      <is-land {...{ 'on:idle': '', import: withBase('/scripts/cart-island.js') }}>
        <span hidden>Loading cart...</span>
      </is-land>
    </body>
  </html>
);
