<script lang="ts">
  import { enhance } from '$app/forms';
  import { goto } from '$app/navigation';
  import Icon from './Icon.svelte';

  export let name = '';
  export let isAdmin = false;
  /** Link para a outra área (admin ↔ biblioteca). */
  export let switchTo: { href: string; label: string; icon: string } | null = null;
  export let onChangePassword: () => void = () => {};
  export let onProfile: () => void = () => {};

  let open = false;
  let root: HTMLDivElement;

  $: initials = (name || '?')
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join('');

  function onWindowClick(e: MouseEvent) {
    if (open && root && !root.contains(e.target as Node)) open = false;
  }
</script>

<svelte:window on:click={onWindowClick} on:keydown={(e) => e.key === 'Escape' && (open = false)} />

<div class="relative" bind:this={root}>
  <button
    type="button"
    class="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 transition hover:bg-slate-100 dark:hover:bg-slate-800"
    aria-haspopup="menu"
    aria-expanded={open}
    on:click={() => (open = !open)}
  >
    <span
      class="flex h-8 w-8 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white"
      >{initials}</span
    >
    <span class="hidden max-w-[10rem] truncate text-sm font-medium sm:block">{name}</span>
    <Icon name="chevron" size={16} />
  </button>

  {#if open}
    <div
      role="menu"
      class="menu-panel absolute right-0 z-50 mt-2 w-56 overflow-hidden rounded-xl border p-1.5 shadow-xl"
    >
      <div class="px-3 py-2">
        <p class="truncate text-sm font-semibold">{name}</p>
        {#if isAdmin}<p class="text-xs text-slate-500 dark:text-slate-400">Administrador</p>{/if}
      </div>
      <hr class="my-1 border-slate-200 dark:border-slate-700" />
      {#if switchTo}
        <a role="menuitem" href={switchTo.href} class="menu-item" on:click={() => (open = false)}>
          <Icon name={switchTo.icon} size={16} />{switchTo.label}
        </a>
      {/if}
      <button
        role="menuitem"
        type="button"
        class="menu-item"
        on:click={() => {
          open = false;
          onChangePassword();
        }}><Icon name="key" size={16} />Alterar senha</button
      >
      <button
        role="menuitem"
        type="button"
        class="menu-item"
        on:click={() => {
          open = false;
          onProfile();
        }}><Icon name="user" size={16} />Perfil</button
      >
      <form
        method="POST"
        action="/admin/users?/logoutUserServer"
        use:enhance={() =>
          async ({ result }) => {
            if (result.type === 'success' && result.data?.status == 200) goto('/auth/login');
          }}
      >
        <button role="menuitem" class="menu-item text-error-600 dark:text-error-400">
          <Icon name="logout" size={16} />Sair
        </button>
      </form>
    </div>
  {/if}
</div>
