<script lang="ts">
  import { onMount } from 'svelte';
  import { eventDetail, eventLabel } from '$lib/utils/event-labels';

  /** Linha do tempo do arquivo (assinante de auditoria: fatos do EventLog por entidade). Só administradores. */
  export let lessonId: string;

  type Item = { id: string; type: string; occurredAt: string; actor: string | null; data: Record<string, unknown> };
  let items: Item[] = [];
  let state: 'loading' | 'ready' | 'error' = 'loading';

  const when = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'medium' });

  async function load() {
    state = 'loading';
    try {
      const res = await fetch(`/api/timeline/${lessonId}`);
      if (!res.ok) throw new Error();
      items = (await res.json()).events;
      state = 'ready';
    } catch {
      state = 'error';
    }
  }
  onMount(load);
</script>

<div data-testid="linha-do-tempo" aria-live="polite">
  {#if state === 'loading'}
    <p class="muted text-sm">Carregando histórico…</p>
  {:else if state === 'error'}
    <p class="text-sm text-error-500" role="alert">Não foi possível carregar o histórico.
      <button type="button" class="underline" on:click={load}>Tentar de novo</button></p>
  {:else if !items.length}
    <p class="muted text-sm">Ainda não há eventos para este arquivo.</p>
  {:else}
    <ol class="space-y-2">
      {#each items as it (it.id)}
        <li class="flex flex-wrap items-center gap-2 text-sm">
          <span class="pill {eventLabel(it.type).tone}">{eventLabel(it.type).text}</span>
          <span class="muted text-xs">{eventDetail(it.type, it.data)}</span>
          {#if it.actor}<span class="muted text-xs">· por {it.actor}</span>{/if}
          <time class="muted ml-auto text-xs tabular-nums" datetime={it.occurredAt}>{when(it.occurredAt)}</time>
        </li>
      {/each}
    </ol>
  {/if}
</div>
