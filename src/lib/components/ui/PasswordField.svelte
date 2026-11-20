<script lang="ts">
  import Icon from '../shell/Icon.svelte';
  import Field from './Field.svelte';

  export let label: string;
  export let value = '';
  export let placeholder = '';
  export let error = '';
  export let id = '';
  export let autocomplete = 'new-password';

  let visible = false;
  const uid = id || `pw-${Math.random().toString(36).slice(2, 8)}`;
</script>

<Field {label} id={uid} required {error}>
  <div class="relative">
    {#if visible}
      <input class="input pr-11 {error ? 'input-error' : ''}" id={uid} type="text" {placeholder} {autocomplete} bind:value />
    {:else}
      <input class="input pr-11 {error ? 'input-error' : ''}" id={uid} type="password" {placeholder} {autocomplete} bind:value />
    {/if}
    <button
      type="button"
      class="icon-btn absolute right-1 top-1/2 h-8 w-8 -translate-y-1/2"
      aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
      aria-pressed={visible}
      on:click={() => (visible = !visible)}
    >
      <Icon name={visible ? 'eyeoff' : 'eye'} size={18} />
    </button>
  </div>
</Field>
