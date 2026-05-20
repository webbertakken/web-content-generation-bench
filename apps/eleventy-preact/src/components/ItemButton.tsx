import type { Item } from '@bench/data';

interface ItemButtonProps {
  item: Item;
}

const formatPrice = (cents: number): string => `\u00a3${(cents / 100).toFixed(2)}`;

export const ItemButton = ({ item }: ItemButtonProps) => (
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
);
