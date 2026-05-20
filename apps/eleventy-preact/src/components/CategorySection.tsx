import type { Category } from '@bench/data';
import { ItemButton } from './ItemButton.js';

interface CategorySectionProps {
  category: Category;
}

export const CategorySection = ({ category }: CategorySectionProps) => (
  <section className="category" aria-labelledby={`cat-${category.id}`}>
    <h2 id={`cat-${category.id}`} className="category__title">
      {category.name}
    </h2>
    <ul className="category__items">
      {category.items.map((item) => (
        <li key={item.id}>
          <ItemButton item={item} />
        </li>
      ))}
    </ul>
  </section>
);
