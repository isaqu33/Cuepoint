<script lang="ts">
  import { page } from '$app/stores';
  import { brand as BRAND } from '$lib/brand';
</script>

<svelte:head><title>{$page.status === 410 ? 'Link indisponível' : 'Não encontrado'} · {BRAND.name}</title><meta name="robots" content="noindex" /></svelte:head>

<main class="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-3 px-6 text-center">
  <p class="text-sm font-semibold tracking-wide muted">{BRAND.name}</p>
  <h1 class="text-xl font-semibold" data-testid="erro-link">{$page.error?.message ?? 'Link não encontrado'}</h1>
  <p class="muted text-sm">
    {#if $page.status === 410}Peça um novo link a quem compartilhou este conteúdo.{:else}Confira o endereço ou peça um novo link a quem compartilhou.{/if}
  </p>
</main>
