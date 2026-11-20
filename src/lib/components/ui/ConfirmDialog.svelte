<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import Icon from '../shell/Icon.svelte';

  export let open = false;
  export let title = 'Tem certeza?';
  export let message = '';
  export let confirmLabel = 'Confirmar';
  export let danger = false;

  const dispatch = createEventDispatcher<{ confirm: void; cancel: void }>();
  let dialog: HTMLDialogElement;

  $: if (dialog) {
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }
</script>

<dialog
  bind:this={dialog}
  class="confirm panel w-[min(92vw,26rem)] p-0"
  on:cancel|preventDefault={() => dispatch('cancel')}
  on:click={(e) => e.target === dialog && dispatch('cancel')}
>
  <div class="p-6">
    <span
      class="mb-4 flex h-10 w-10 items-center justify-center rounded-full {danger
        ? 'bg-error-500/15 text-error-500'
        : 'bg-primary-500/15 text-primary-500'}"
    >
      <Icon name={danger ? 'alert' : 'check'} size={20} />
    </span>
    <h3 class="text-base font-semibold">{title}</h3>
    {#if message}<p class="muted mt-1.5 text-sm leading-relaxed">{message}</p>{/if}
  </div>
  <div class="flex justify-end gap-2 px-6 pb-6">
    <button type="button" class="btn btn-sm variant-ringed" on:click={() => dispatch('cancel')}>Cancelar</button>
    <button
      type="button"
      class="btn btn-sm {danger ? 'variant-filled-error' : 'variant-filled-primary'}"
      on:click={() => dispatch('confirm')}>{confirmLabel}</button
    >
  </div>
</dialog>

<style>
  .confirm::backdrop {
    background: rgb(0 0 0 / 0.55);
    backdrop-filter: blur(2px);
  }
  dialog {
    color: inherit;
    margin: auto;
  }
</style>
