<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import Plyr from 'plyr';
  export let src: string;

  let player: Plyr;

  function createPlyr() {
    if (player) {
      player.destroy();
    }

    player = new Plyr('audio', {});
    //@ts-ignore
    window.player = player;
  }

  onMount(() => {
    createPlyr();
  });

  // Só no navegador: o Plyr não existe no servidor (SSR).
  $: if (typeof window !== 'undefined') createPlyr();

  onDestroy(() => {
    if (player) {
      player.destroy();
    }
  });
</script>

<div class="panel w-full max-w-md p-2">
  <audio
    class="plyr"
    crossorigin="anonymous"
    playsinline
  >
    <source {src} type="audio/mp3" />
  </audio>
</div>
