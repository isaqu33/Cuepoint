<script lang="ts">
  import Icon from '../shell/Icon.svelte';
  export let src: string | null | undefined = '';
  export let icon = 'file';
  let failed = false;
  $: if (src) failed = false;
</script>

<span
  class="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg"
  style="background: rgb(var(--cp-surface-2)); color: rgb(var(--cp-muted))"
>
  {#if src && !failed}
    <img {src} alt="" loading="lazy" class="h-full w-full object-cover" on:error={() => (failed = true)} />
  {:else}
    <Icon name={icon} size={18} />
  {/if}
</span>
