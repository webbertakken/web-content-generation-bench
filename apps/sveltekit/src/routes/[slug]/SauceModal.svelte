<script lang="ts">
  import type { Item } from '@bench/data';

  interface Props {
    item: Item | null;
    onChoose: (sauceId: string) => void;
    onCancel: () => void;
  }
  let { item, onChoose, onCancel }: Props = $props();

  let selected = $state('');
  let modalEl: HTMLElement | undefined = $state();

  // Sync internal selection state when the active item changes.
  $effect(() => {
    if (item) {
      selected = item.sauces[0]?.id ?? '';
    }
  });

  // Mirror our open/closed state into Pie modal's `isOpen` property.
  $effect(() => {
    if (modalEl) {
      // The Pie modal is a Lit element with an isOpen property.
      (modalEl as HTMLElement & { isOpen?: boolean }).isOpen = item !== null;
    }
  });

  const handleConfirm = (event: Event) => {
    event.preventDefault();
    if (selected) onChoose(selected);
  };
</script>

<pie-modal
  bind:this={modalEl}
  heading={item ? `Add ${item.name}` : 'Choose your sauce'}
  heading-level="h2"
  size="small"
  is-dismissible="true"
  onpie-modal-close={onCancel}
  onpie-modal-back={onCancel}
>
  {#if item}
    <form onsubmit={handleConfirm}>
      <p class="modal__description">{item.description}</p>
      <pie-radio-group
        name="sauce"
        value={selected}
        onchange={(event: Event) => (selected = (event.target as HTMLInputElement).value)}
      >
        {#each item.sauces as sauce (sauce.id)}
          <pie-radio value={sauce.id} checked={selected === sauce.id}>
            {sauce.name}{#if sauce.surcharge > 0} (+{`\u00a3${(sauce.surcharge / 100).toFixed(2)}`}){/if}
          </pie-radio>
        {/each}
      </pie-radio-group>
      <div slot="footer" class="modal__footer">
        <pie-button type="submit" variant="primary" onclick={handleConfirm}>Add to basket</pie-button>
        <pie-button type="button" variant="ghost" onclick={onCancel}>Cancel</pie-button>
      </div>
    </form>
  {/if}
</pie-modal>
