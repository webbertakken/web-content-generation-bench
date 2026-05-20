'use client';

import { useEffect, useRef, useState } from 'react';
import type { Item } from '@bench/data';

interface SauceModalProps {
  item: Item | null;
  onChoose: (sauceId: string) => void;
  onCancel: () => void;
}

type PieModalElement = HTMLElement & { isOpen?: boolean };

export default function SauceModal({ item, onChoose, onCancel }: SauceModalProps) {
  const modalRef = useRef<PieModalElement | null>(null);
  const [selected, setSelected] = useState<string>('');

  useEffect(() => {
    if (item) {
      setSelected(item.sauces[0]?.id ?? '');
    }
  }, [item]);

  // Pie modal uses the `isOpen` prop; sync it with our React state.
  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    el.isOpen = item !== null;
  }, [item]);

  useEffect(() => {
    const el = modalRef.current;
    if (!el) return;
    const onClose = () => onCancel();
    el.addEventListener('pie-modal-close', onClose);
    el.addEventListener('pie-modal-back', onClose);
    return () => {
      el.removeEventListener('pie-modal-close', onClose);
      el.removeEventListener('pie-modal-back', onClose);
    };
  }, [onCancel]);

  const handleConfirm = () => {
    if (selected) onChoose(selected);
  };

  // Render the modal element even when no item is active, so the custom
  // element is present in the DOM and Pie's own focus management can run.
  return (
    <pie-modal
      ref={modalRef as unknown as React.Ref<HTMLElement>}
      heading={item ? `Add ${item.name}` : 'Choose your sauce'}
      heading-level="h2"
      size="small"
      is-dismissible="true"
    >
      {item ? (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            handleConfirm();
          }}
        >
          <p className="modal__description">{item.description}</p>
          <pie-radio-group
            name="sauce"
            value={selected}
            onChange={(event: React.ChangeEvent<HTMLElement>) => {
              const target = event.target as HTMLInputElement;
              setSelected(target.value);
            }}
          >
            {item.sauces.map((sauce) => (
              <pie-radio
                key={sauce.id}
                value={sauce.id}
                {...(selected === sauce.id ? { checked: true } : {})}
              >
                {sauce.name}
                {sauce.surcharge > 0 ? ` (+\u00a3${(sauce.surcharge / 100).toFixed(2)})` : ''}
              </pie-radio>
            ))}
          </pie-radio-group>
          <div slot="footer" className="modal__footer">
            <pie-button type="submit" variant="primary" onClick={handleConfirm}>
              Add to basket
            </pie-button>
            <pie-button type="button" variant="ghost" onClick={onCancel}>
              Cancel
            </pie-button>
          </div>
        </form>
      ) : null}
    </pie-modal>
  );
}
