<script lang="ts">
  import { invalidateAll } from '$app/navigation';
  import Icon from '../shell/Icon.svelte';

  export let title: string;
  export let description = '';
  /** Mostra o botão para recarregar os dados da lista. */
  export let reload = true;

  let spinning = false;
  async function refresh() {
    spinning = true;
    const minimum = new Promise((r) => setTimeout(r, 500)); // feedback visual mesmo se for rápido
    await Promise.all([invalidateAll(), minimum]);
    spinning = false;
  }
</script>

<header class="mb-6 flex flex-wrap items-end justify-between gap-4">
  <div>
    <h1 class="page-title">{title}</h1>
    {#if description}<p class="page-sub mt-1 max-w-2xl">{description}</p>{/if}
  </div>
  <div class="flex items-center gap-2">
    {#if reload}
      <button
        type="button"
        class="btn btn-sm variant-ringed gap-1.5"
        title="Atualizar a lista"
        aria-label="Atualizar a lista"
        disabled={spinning}
        on:click={refresh}
      >
        <span class="inline-flex {spinning ? 'animate-spin' : ''}"><Icon name="refresh" size={16} /></span>
        <span class="hidden sm:inline">Atualizar</span>
      </button>
    {/if}
    <slot />
  </div>
</header>
