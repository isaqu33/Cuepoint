<script lang="ts">
  import Icon from '../shell/Icon.svelte';
  import { acceptsFile, dropInto } from '$lib/utils/dropzone';

  /** URL (ou data URL) da imagem atual/selecionada. */
  export let preview = '';
  export let error = '';
  export let id = 'photo';
  export let name = 'files';
  export let label = 'Enviar imagem';

  const accept = '.jpg, .jpeg, .png, .gif';
  let fileName = '';
  let over = false;
  let input: HTMLInputElement;
  let dropError = '';

  function onDrop(e: DragEvent) {
    over = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!acceptsFile(file, accept)) {
      dropError = 'Formato não suportado. Use JPG, PNG ou GIF.';
      return;
    }
    dropError = '';
    dropInto(input, file);
  }
  function onChange(e: Event) {
    fileName = (e.target as HTMLInputElement).files?.[0]?.name ?? '';
  }
</script>

<div class="w-full">
  <label
    for={id}
    on:dragover|preventDefault={() => (over = true)}
    on:dragleave={() => (over = false)}
    on:drop|preventDefault={onDrop}
    class="picker group relative flex w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed text-center transition-colors {preview ? 'aspect-video max-h-60' : 'h-32'} {error || dropError ? 'border-error-500' : ''} {over ? 'picker-over' : ''}"
  >
    {#if preview}
      <img src={preview} alt="Prévia da imagem selecionada" class="absolute inset-0 h-full w-full object-cover" />
      <span
        class="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-8 text-xs font-medium text-white"
      >
        <span class="truncate">{fileName || 'Imagem atual'}</span>
        <span class="shrink-0 rounded-md bg-white/20 px-2 py-1 backdrop-blur">Trocar imagem</span>
      </span>
    {:else}
      <span class="muted flex flex-col items-center gap-2 px-4">
        <Icon name="plus" size={24} />
        <span class="text-sm font-medium">{over ? 'Solte a imagem aqui' : 'Arraste a imagem ou clique para enviar'}</span>
        <span class="text-xs">JPG, PNG ou GIF</span>
      </span>
    {/if}
  </label>
  <input bind:this={input} {id} {name} type="file" {accept} class="sr-only" on:change={onChange} on:change />
  {#if error || dropError}<p class="mt-1.5 text-sm text-error-500" role="alert">{dropError || error}</p>{/if}
</div>

<style>
  .picker {
    border-color: rgb(var(--cp-border));
    background: rgb(var(--cp-surface-2));
  }
  .picker:hover,
  .picker-over {
    border-color: rgb(var(--color-primary-500));
  }
  .picker-over {
    background: rgb(var(--color-primary-500) / 0.1);
  }
</style>
