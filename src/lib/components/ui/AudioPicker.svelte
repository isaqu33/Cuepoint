<script lang="ts">
  import Icon from '../shell/Icon.svelte';
  import AudioAdminPlayer from '../AudioAdminPlayer.svelte';
  import { acceptsFile, dropInto } from '$lib/utils/dropzone';

  /** URL do áudio atual/selecionado (para ouvir antes de salvar). */
  export let src = '';
  export let fileName = '';
  export let error = '';
  export let id = 'audio';
  export let name = 'files';

  const accept = '.mp3, .wav, .ogg, .m4a, .aac, .flac, .mp4, .mov, .webm, .mkv';
  let over = false;
  let input: HTMLInputElement;
  let dropError = '';

  function onDrop(e: DragEvent) {
    over = false;
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (!acceptsFile(file, accept)) {
      dropError = 'Formato não suportado. Use MP3, WAV, OGG, M4A ou vídeo (MP4, MOV, WEBM).';
      return;
    }
    dropError = '';
    dropInto(input, file);
  }
</script>

<div class="w-full">
  <label
    for={id}
    on:dragover|preventDefault={() => (over = true)}
    on:dragleave={() => (over = false)}
    on:drop|preventDefault={onDrop}
    class="picker flex w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed px-4 py-6 text-center transition-colors {error || dropError
      ? 'border-error-500'
      : ''} {over ? 'picker-over' : ''}"
  >
    <span class="muted flex flex-col items-center gap-2">
      <Icon name="mic" size={24} />
      <span class="max-w-full truncate text-sm font-medium">
        {#if over}Solte o arquivo aqui{:else if fileName}{fileName}{:else if src}Arraste outro arquivo ou clique para trocar{:else}Arraste o áudio ou vídeo ou clique para enviar{/if}
      </span>
      <span class="text-xs">Áudio (MP3, WAV, OGG, M4A) ou vídeo (MP4, MOV, WEBM)</span>
    </span>
  </label>
  <input bind:this={input} {id} {name} type="file" {accept} class="sr-only" on:change />
  {#if src}
    {#key src}
      <div class="mt-3"><AudioAdminPlayer {src} /></div>
    {/key}
  {/if}
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
