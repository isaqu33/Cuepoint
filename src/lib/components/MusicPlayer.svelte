<script>
  // @ts-nocheck
  import { onMount, onDestroy } from 'svelte';
  import Plyr from 'plyr';
  import { currentAudioSelected } from '$lib/stores/currentAudioSelected';

  export let nameLesson = '';
  export let bookName = '';
  export let studiesName = '';

  let count = {};
  currentAudioSelected.subscribe((value) => {
    count = value;
  });

  let player;

  function createPlyr() {
    if (player) player.destroy();
    player = new Plyr('audio', {});
    window.player = player;
  }

  onMount(createPlyr);
  $: if (typeof window !== 'undefined') createPlyr();

  onDestroy(() => {
    if (player) player.destroy();
  });
</script>

<div
  class="player-bar flex w-full items-center gap-4 border-t px-4 py-3 md:px-8"
  key={count.src}
  role="region"
  aria-label="Player de áudio"
>
  {#if count.srcImg}
    <img alt="" src={count.srcImg} class="hidden h-14 w-14 shrink-0 rounded-lg object-cover sm:block" />
  {/if}
  <div class="min-w-0 sm:w-64 md:w-72">
    <p class="truncate text-sm font-semibold">{nameLesson}</p>
    <p class="muted truncate text-xs">{bookName} · {studiesName}</p>
  </div>
  <div class="min-w-0 flex-1">
    <audio class="plyr" crossorigin="anonymous" playsinline>
      {#if count.src}
        <source src={count.src} type="audio/mp3" />
      {:else}
        <p>Áudio indisponível</p>
      {/if}
    </audio>
  </div>
</div>

<style>
  .player-bar {
    background-color: rgb(var(--cp-surface));
    border-color: rgb(var(--cp-border));
  }
</style>
