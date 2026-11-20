<script lang="ts">
  import { InputChip, Autocomplete } from '@skeletonlabs/skeleton';
  import type { AutocompleteOption } from '@skeletonlabs/skeleton';
  import Field from './Field.svelte';

  export let label: string;
  export let placeholder = '';
  export let error = '';
  export let hint = '';
  export let options: AutocompleteOption<string>[] = [];
  export let value: string[] = [];
  export let input = '';
</script>

<Field {label} required {error} {hint}>
  <InputChip
    class="input {error ? 'input-error' : ''}"
    {placeholder}
    rounded="rounded-lg"
    bind:input
    bind:value
    name="chips"
  />
  <div class="chip-options mt-2 max-h-40 overflow-y-auto rounded-xl p-2" tabindex="-1">
    <Autocomplete bind:input {options} on:selection />
  </div>
</Field>

<style>
  .chip-options {
    border: 1px solid rgb(var(--cp-border));
    background: rgb(var(--cp-surface-2));
  }
</style>
