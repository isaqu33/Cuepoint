<script lang="ts">
  import { page } from '$app/stores';
  import Logo from '../Logo.svelte';
  import Icon from './Icon.svelte';
  import ThemeToggle from './ThemeToggle.svelte';
  import UserMenu from './UserMenu.svelte';
  import { openDrawer } from '$lib/stores/drawer';
  import type { NavGroup } from '$lib/nav';

  export let groups: NavGroup[] = [];
  /** Mostra o botão "Novo arquivo" (abre o painel de criação). */
  export let showNew = false;
  /** Modo embutido (dentro do painel lateral): só o conteúdo. */
  export let bare = false;
  export let userName = '';
  export let isAdmin = false;
  export let switchTo: { href: string; label: string; icon: string } | null = null;
  export let onChangePassword: () => void = () => {};
  export let onProfile: () => void = () => {};

  let mobileOpen = false;

  $: path = $page.url.pathname;
  const isActive = (n: { href: string; match?: string; exact?: boolean }, p: string) =>
    n.exact ? p === (n.match ?? n.href) : p.startsWith(n.match ?? n.href);
  // O item mais específico vence (ex.: /admin/users/requests não ativa /admin/users).
  $: allItems = groups.flatMap((g) => g.items);
  $: activeHref = allItems
    .filter((n) => isActive(n, path))
    .sort((a, b) => (b.match ?? b.href).length - (a.match ?? a.href).length)[0]?.href;
</script>

<div class="flex h-full w-full">
  <!-- Sidebar (desktop) e gaveta (mobile) -->
  {#if !bare && mobileOpen}
    <button
      type="button"
      class="fixed inset-0 z-30 bg-black/50 md:hidden"
      aria-label="Fechar menu"
      on:click={() => (mobileOpen = false)}
    ></button>
  {/if}
  {#if !bare}
  <aside
    class="sidebar fixed inset-y-0 left-0 z-40 flex w-64 flex-col border-r transition-transform md:static md:translate-x-0 {mobileOpen
      ? 'translate-x-0'
      : '-translate-x-full'}"
  >
    <div class="flex h-16 items-center justify-between px-5">
      <a href="/app" aria-label="Cuepoint — início">
        <Logo size={32} textClass="text-xl font-extrabold tracking-tight" />
      </a>
      <button
        type="button"
        class="icon-btn md:hidden"
        aria-label="Fechar menu"
        on:click={() => (mobileOpen = false)}><Icon name="close" size={18} /></button
      >
    </div>

    <nav class="flex-1 overflow-y-auto px-3 pb-3" aria-label="Navegação principal">
      {#each groups as group}
        {#if group.title}<p class="nav-group">{group.title}</p>{/if}
        <div class="space-y-0.5 {group.title ? '' : 'pt-3'}">
          {#each group.items as item}
            <a
              href={item.href}
              class="nav-link {activeHref === item.href ? 'nav-link-active' : ''}"
              aria-current={activeHref === item.href ? 'page' : undefined}
              on:click={() => (mobileOpen = false)}
            >
              <Icon name={item.icon} size={18} />
              {item.label}
            </a>
          {/each}
        </div>
      {/each}
    </nav>
  </aside>
  {/if}

  <!-- Conteúdo -->
  <div class="flex min-w-0 flex-1 flex-col">
    {#if !bare}
    <header class="topbar flex h-16 shrink-0 items-center justify-between gap-3 border-b px-4 md:px-8">
      <button
        type="button"
        class="icon-btn md:hidden"
        aria-label="Abrir menu"
        on:click={() => (mobileOpen = true)}><Icon name="menu" size={20} /></button
      >
      <div class="flex-1"></div>
      {#if showNew}
        <button
          type="button"
          class="btn btn-sm variant-filled-primary hidden gap-1.5 sm:inline-flex"
          on:click={() => openDrawer('Novo arquivo', '/admin/lessons/create')}
        >
          <Icon name="plus" size={16} />Novo arquivo
        </button>
      {/if}
      <ThemeToggle />
      <UserMenu name={userName} {isAdmin} {switchTo} {onChangePassword} {onProfile} />
    </header>
    {/if}

    <main class="min-h-0 flex-1 overflow-y-auto {bare ? 'embed-frame' : ''}">
      <slot />
    </main>

    <slot name="footer" />
  </div>
</div>
