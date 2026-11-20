<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import { brand as BRAND } from '$lib/brand';
  import { formatTimestamp, type TimedCue } from '../../../server/transcription/subtitles';

  export let data: { token: string; title: string; description: string; photo: string; hasAudio: boolean; isVideo: boolean; expiresAt: string; cues: TimedCue[] };

  let audio: HTMLMediaElement | undefined;
  let active = -1;
  let ticker: ReturnType<typeof setInterval>;
  const until = new Date(data.expiresAt).toLocaleString('pt-BR', { dateStyle: 'long', timeStyle: 'short' });
  const href = (f: string) => `/s/${data.token}/export?format=${f}`;

  function seek(i: number) {
    if (!audio) return;
    audio.currentTime = data.cues[i].startMs / 1000;
    void audio.play();
  }
  onMount(() => {
    ticker = setInterval(() => {
      if (!audio) return;
      const t = audio.currentTime * 1000;
      const idx = data.cues.findIndex((c) => t >= c.startMs && t < c.endMs);
      if (idx !== active) {
        active = idx;
        document.getElementById(`c-${idx}`)?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }, 250);
  });
  onDestroy(() => clearInterval(ticker));
</script>

<svelte:head>
  <title>{data.title} · {BRAND.name}</title>
  <meta name="robots" content="noindex, nofollow" />
  <meta name="referrer" content="no-referrer" />
</svelte:head>

<main class="mx-auto w-full max-w-3xl px-4 py-8 md:py-12">
  <p class="muted mb-6 text-sm"><span class="font-semibold">{BRAND.name}</span> · conteúdo compartilhado</p>

  <article class="card p-5 md:p-6">
    {#if data.photo && !data.isVideo}
      <div class="mb-4 aspect-video w-full overflow-hidden rounded-xl" style="background: rgb(var(--cp-surface-2))">
        <img alt="" src={data.photo} class="h-full w-full object-cover" />
      </div>
    {/if}
    <h1 class="text-xl font-bold tracking-tight" data-testid="titulo-compartilhado">{data.title}</h1>
    {#if data.description}<p class="muted mt-2 text-sm leading-relaxed">{data.description}</p>{/if}

    {#if data.hasAudio && data.isVideo}
      <!-- svelte-ignore a11y-media-has-caption -->
      <video bind:this={audio} controls preload="metadata" class="mt-5 aspect-video w-full rounded-xl bg-black" src={`/s/${data.token}/audio`} aria-label="Player de vídeo"></video>
    {:else if data.hasAudio}
      <audio bind:this={audio} controls preload="metadata" class="mt-5 w-full" src={`/s/${data.token}/audio`} aria-label="Player de áudio"></audio>
    {/if}

    {#if data.cues.length}
      <div class="mt-6 flex flex-wrap items-center justify-between gap-2">
        <h2 class="text-base font-semibold">Transcrição</h2>
        <span class="flex items-center gap-2">
          <span class="muted text-xs">Baixar:</span>
          {#each ['txt', 'srt', 'vtt'] as f}<a class="btn btn-sm variant-ringed" href={href(f)} download>{f.toUpperCase()}</a>{/each}
        </span>
      </div>
      <ol class="mt-3 max-h-[55vh] space-y-1 overflow-y-auto pr-1">
        {#each data.cues as cue, i}
          <li id={`c-${i}`}>
            <button type="button" class="cue {active === i ? 'cue-active' : ''}" on:click={() => seek(i)}>
              <span class="cue-time">{formatTimestamp(cue.startMs).slice(0, 8)}</span>
              <span class="text-left">{cue.text}</span>
            </button>
          </li>
        {/each}
      </ol>
    {:else}
      <p class="muted mt-6 text-sm">Este arquivo ainda não tem transcrição.</p>
    {/if}
  </article>

  <p class="muted mt-4 text-center text-xs">Este link é válido até {until}.</p>
</main>

<style>
  .cue { display: flex; width: 100%; gap: 0.75rem; align-items: baseline; border-radius: 10px; padding: 0.5rem 0.75rem; font-size: 0.9rem; line-height: 1.5; }
  .cue:hover { background-color: rgb(var(--cp-surface-2)); }
  .cue-active { background-color: rgb(var(--color-primary-500) / 0.12); box-shadow: inset 3px 0 0 rgb(var(--color-primary-500)); }
  .cue-time { flex-shrink: 0; font-variant-numeric: tabular-nums; font-size: 0.75rem; color: rgb(var(--cp-muted)); }
</style>
