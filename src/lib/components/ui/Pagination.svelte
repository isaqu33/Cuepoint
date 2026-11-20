<script lang="ts">
  import { goto } from '$app/navigation';
  import Icon from '../shell/Icon.svelte';

  /** Página atual (base 0). */
  export let page = 0;
  export let total = 0;
  export let pageSize = 50;
  export let basePath: string;

  $: pages = Math.max(1, Math.ceil(total / pageSize));
  $: from = total === 0 ? 0 : page * pageSize + 1;
  $: to = Math.min(total, (page + 1) * pageSize);
  const go = (n: number) => goto(`${basePath}?page=${n}`);
</script>

{#if total > 0}
  <div class="mt-4 flex items-center justify-between text-sm">
    <p class="muted">Mostrando {from}–{to} de {total}</p>
    {#if pages > 1}
      <div class="flex items-center gap-1">
        <button class="row-btn" disabled={page <= 0} aria-label="Página anterior" on:click={() => go(page - 1)}>
          <span class="inline-flex rotate-90"><Icon name="chevron" size={16} /></span>
        </button>
        <span class="muted px-2 tabular-nums">{page + 1} / {pages}</span>
        <button class="row-btn" disabled={page >= pages - 1} aria-label="Próxima página" on:click={() => go(page + 1)}>
          <span class="inline-flex -rotate-90"><Icon name="chevron" size={16} /></span>
        </button>
      </div>
    {/if}
  </div>
{/if}
