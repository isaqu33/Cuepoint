<script lang="ts">
  import { enhance } from '$app/forms';
  import type { SubmitFunction } from '@sveltejs/kit';
  import { invalidateAll } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { openDrawer } from '$lib/stores/drawer';
  import Icon from '../shell/Icon.svelte';
  import ConfirmDialog from './ConfirmDialog.svelte';

  interface Item {
    label: string;
    icon: string;
    /** Nome da action do SvelteKit na rota atual (ex.: deleteAction). */
    action: string;
    danger?: boolean;
    /** Mensagem de confirmação; sem ela, executa direto. */
    confirm?: string;
    confirmLabel?: string;
    disabled?: boolean;
    hidden?: boolean;
  }

  export let id: string;
  /** Rota do formulário de edição, aberta em painel lateral. */
  export let editSrc: string | null = null;
  export let editTitle = 'Editar';
  export let items: Item[] = [];

  const toast = getToastStore();
  let form: HTMLFormElement;
  let pending: Item | null = null;
  let busy = false;

  function run(item: Item) {
    form.action = `?/${item.action}`;
    form.requestSubmit();
  }
  const handle: SubmitFunction = () => {
    busy = true;
    return async ({ result }) => {
      busy = false;
      const data = (result.type === 'success' ? result.data : null) as {
        status?: number;
        statusText?: string;
      } | null;
      const ok = data?.status === 200;
      toast.trigger({
        message: ok ? 'Ação concluída com sucesso' : (data?.statusText ?? 'Algo deu errado').toString(),
        background: ok ? 'variant-filled-success' : 'variant-filled-error',
        hideDismiss: true,
      });
      if (ok) await invalidateAll();
    };
  };

  function click(item: Item) {
    if (item.confirm) pending = item;
    else run(item);
  }
</script>

<div class="flex items-center justify-end gap-1">
  {#if editSrc}
    <button type="button" class="row-btn" title="Editar" aria-label="Editar" on:click={() => openDrawer(editTitle, editSrc)}>
      <Icon name="edit" size={16} />
    </button>
  {/if}

  {#each items.filter((i) => !i.hidden) as item}
    <button
      type="button"
      class="row-btn {item.danger ? 'row-btn-danger' : ''}"
      title={item.label}
      aria-label={item.label}
      disabled={item.disabled || busy}
      on:click={() => click(item)}
    >
      <Icon name={item.icon} size={16} />
    </button>
  {/each}

  <form
    method="POST"
    bind:this={form}
    class="hidden"
    use:enhance={handle}
  >
    <input type="hidden" name="id" value={id} />
  </form>
</div>

<ConfirmDialog
  open={pending !== null}
  title={pending?.label ?? ''}
  message={pending?.confirm ?? ''}
  confirmLabel={pending?.confirmLabel ?? 'Confirmar'}
  danger={pending?.danger ?? false}
  on:cancel={() => (pending = null)}
  on:confirm={() => {
    const item = pending;
    pending = null;
    if (item) run(item);
  }}
/>
