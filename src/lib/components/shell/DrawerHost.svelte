<script lang="ts">
  import { onDestroy } from 'svelte';
  import { invalidateAll } from '$app/navigation';
  import { getToastStore } from '@skeletonlabs/skeleton';
  import { drawer, closeDrawer } from '$lib/stores/drawer';
  import Icon from './Icon.svelte';

  const toast = getToastStore();
  let loading = true;
  let frame: HTMLIFrameElement | undefined;

  $: src = $drawer.src + ($drawer.src.includes('?') ? '&' : '?') + 'embed=1';
  $: if ($drawer.open) loading = true;

  let finished = false;
  let poll: ReturnType<typeof setInterval> | undefined;

  /**
   * Os formulários existentes terminam voltando para a lista por navegação interna
   * (sem recarregar a página), então o evento "load" do iframe não basta: observamos
   * o endereço do painel. Ao sair de /create, /update ou /batch, o salvamento foi concluído.
   */
  async function check() {
    if (finished || !frame) return;
    let path = '';
    let cancelled = false;
    try {
      path = frame.contentWindow?.location.pathname ?? '';
      cancelled = frame.contentWindow?.location.search.includes('cancelled') ?? false;
    } catch {
      return;
    }
    if (!path.startsWith('/admin') && !path.startsWith('/auth')) return; // about:blank
    loading = false;
    if (path.startsWith('/auth') || !/\/(create|update|batch)(\/|$)/.test(path)) {
      finished = true;
      closeDrawer();
      if (cancelled) return;
      await invalidateAll();
      toast.trigger({ message: 'Alterações salvas', background: 'variant-filled-success', hideDismiss: true });
    }
  }

  $: if ($drawer.open) {
    finished = false;
    clearInterval(poll);
    poll = setInterval(check, 250);
  } else {
    clearInterval(poll);
  }

  onDestroy(() => clearInterval(poll));
</script>

<svelte:window on:keydown={(e) => $drawer.open && e.key === 'Escape' && closeDrawer()} />

{#if $drawer.open}
  <div class="fixed inset-0 z-50 flex justify-end">
    <button
      type="button"
      class="absolute inset-0 cursor-default bg-black/50 backdrop-blur-[2px]"
      aria-label="Fechar painel"
      on:click={closeDrawer}
    ></button>

    <aside
      class="drawer relative flex h-full w-full max-w-2xl flex-col border-l shadow-2xl"
      role="dialog"
      aria-modal="true"
      aria-label={$drawer.title}
    >
      <header class="flex h-16 shrink-0 items-center justify-between border-b px-6" style="border-color: rgb(var(--cp-border))">
        <h2 class="text-base font-semibold">{$drawer.title}</h2>
        <button type="button" class="icon-btn" aria-label="Fechar" on:click={closeDrawer}>
          <Icon name="close" size={18} />
        </button>
      </header>

      <div class="relative min-h-0 flex-1">
        {#if loading}
          <div class="absolute inset-0 z-10 flex items-center justify-center" style="background: rgb(var(--cp-surface))">
            <span class="muted text-sm">Carregando…</span>
          </div>
        {/if}
        {#key src}
          <iframe bind:this={frame} {src} title={$drawer.title} class="h-full w-full border-0" on:load={check}></iframe>
        {/key}
      </div>
    </aside>
  </div>
{/if}

<style>
  .drawer {
    background-color: rgb(var(--cp-surface));
    border-color: rgb(var(--cp-border));
    animation: slide-in 0.22s ease-out;
  }
  @keyframes slide-in {
    from { transform: translateX(24px); opacity: 0; }
    to { transform: none; opacity: 1; }
  }
</style>
