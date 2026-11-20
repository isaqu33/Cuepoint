<script lang="ts">
  import Icon from '../shell/Icon.svelte';
  export let icon = 'folder';
  export let title = 'Nada por aqui ainda';
  export let description = '';
</script>

<div class="flex flex-col items-center gap-3 px-6 py-16 text-center">
  <span class="flex h-12 w-12 items-center justify-center rounded-full" style="background: rgb(var(--cp-surface-2)); color: rgb(var(--cp-muted))">
    <Icon name={icon} size={22} />
  </span>
  <p class="text-base font-semibold">{title}</p>
  {#if description}<p class="page-sub max-w-sm">{description}</p>{/if}
  <slot />
</div>
