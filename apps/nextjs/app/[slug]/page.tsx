import type { Restaurant } from '@bench/data';
import { loadBenchDataset } from '../../lib/dataset';
import CartIsland from './CartIsland';

const formatPrice = (cents: number): string => `\u00a3${(cents / 100).toFixed(2)}`;

export async function generateStaticParams() {
  const dataset = loadBenchDataset();
  return dataset.restaurants.map((r) => ({ slug: r.slug }));
}

// Force fully static generation; no fallback at runtime.
export const dynamicParams = false;

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function MenuPage({ params }: PageProps) {
  const { slug } = await params;
  const dataset = loadBenchDataset();
  const restaurant = dataset.restaurants.find((r: Restaurant) => r.slug === slug);
  if (!restaurant) throw new Error(`No restaurant with slug "${slug}"`);

  return (
    <>
      <header className="site-header">
        <img
          className="site-header__image"
          src={restaurant.headerImage}
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
            <section key={category.id} className="category" aria-labelledby={`cat-${category.id}`}>
              <h2 id={`cat-${category.id}`} className="category__title">
                {category.name}
              </h2>
              <ul className="category__items">
                {category.items.map((item) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      className="item"
                      data-item-id={item.id}
                      aria-label={`Add ${item.name} to your basket`}
                    >
                      <span className="item__name">{item.name}</span>
                      <span className="item__description">{item.description}</span>
                      <span className="item__price">{formatPrice(item.price)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </section>

        <CartIsland restaurant={restaurant} />
      </main>
    </>
  );
}
