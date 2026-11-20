<script lang="ts">
  import Icon from '../shell/Icon.svelte';

  export let title: string;
  export let description = '';
  /** Fecha o modal (parent.onClose do Skeleton). */
  export let onClose: () => void;
</script>

<div class="panel w-[min(92vw,28rem)] overflow-hidden" role="dialog" aria-modal="true" aria-label={title}>
  <header class="flex items-start justify-between gap-4 px-6 pb-2 pt-6">
    <div>
      <h2 class="text-lg font-semibold tracking-tight">{title}</h2>
      {#if description}<p class="muted mt-1 text-sm leading-relaxed">{description}</p>{/if}
    </div>
    <button type="button" class="icon-btn -mr-2 -mt-1 shrink-0" aria-label="Fechar" on:click={onClose}>
      <Icon name="close" size={18} />
    </button>
  </header>

  <div class="space-y-5 px-6 py-4"><slot /></div>

  <footer class="flex items-center justify-end gap-2 border-t px-6 py-4" style="border-color: rgb(var(--cp-border))">
    <slot name="footer" />
  </footer>
</div>
