<script lang="ts">
  import { currentAudioSelected } from '$lib/stores/currentAudioSelected';
  import { page } from '$app/stores';
  import type { CustomPageData } from './type';
  import { onMount, onDestroy } from 'svelte';
  import TranscribeIcon from '$lib/components/icons/TranscribeIcon.svelte';
  import DescriptionIcon from '$lib/components/icons/DescriptionIcon.svelte';
  import type Quill from 'quill';
  import { formatTimestamp, parseVttToCues, type TimedCue } from '../../../../server/transcription/subtitles';
  import CueEditor from '$lib/components/review/CueEditor.svelte';
  import Timeline from '$lib/components/review/Timeline.svelte';
  import ShareDialog from '$lib/components/ui/ShareDialog.svelte';
  import { isVideoMedia } from '$lib/utils/media';
  import Icon from '$lib/components/shell/Icon.svelte';

  export let data: CustomPageData;

  let count: { src?: string; nameLesson?: string; idLessonAudio?: string } = {};

  currentAudioSelected.subscribe((value) => {
    count = value;
  });

  function clearState() {
    currentAudioSelected.clear();
  }

  async function increment() {
    await clearState();

    currentAudioSelected.update((count) => {
      const newCount = { ...count };
      newCount.src = data.data.audiofile;
      newCount.nameLesson = data.data.title;
      newCount.idLessonAudio = data.data.id;
      newCount.srcImg = data.data.photoLeson;
      newCount.bookName = data.book;
      newCount.studiesName = data.studies;
      return newCount;
    });
  }

  // Vídeo: o player é o próprio <video> da página (e os trechos clicáveis falam com ele). Áudio usa o player global.
  const isVideo = isVideoMedia(data.data.audiofile, data.data.files?.[1]?.type);
  let videoEl: HTMLVideoElement | undefined;

  let quill: Quill;
  let editor: string | HTMLElement;

  // Transcrição com tempo: cues clicáveis que acompanham o player. Edição só para administradores.
  let cues: TimedCue[] = data.data.transcript?.vtt ? parseVttToCues(data.data.transcript.vtt) : [];
  $: cueTimes = cues.map((c) => ({ start: c.startMs / 1000, end: c.endMs / 1000 }));
  let editing = false;
  let showTimeline = false;
  let sharing = false;
  let savedNotice = '';
  const lessonId = data.data.id;
  const exportHref = (f: string) => `/api/transcriptions/${lessonId}/export?format=${f}`;
  function onSaved(e: CustomEvent<TimedCue[]>) {
    cues = e.detail;
    editing = false;
    savedNotice = 'Transcrição salva.';
    setTimeout(() => (savedNotice = ''), 4000);
    showTimeline = false;
  }
  let activeIndex = -1;
  let ticker: ReturnType<typeof setInterval>;

  function seek(i: number) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const player = (window as any).player;
    if (player) {
      player.currentTime = cueTimes[i].start;
      player.play?.();
    }
  }

  onDestroy(() => clearInterval(ticker));

  onMount(async () => {
    if (isVideo) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (window as any).player = videoEl;
    } else {
      increment();
    }

    if (cues.length) {
      ticker = setInterval(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const t = (window as any).player?.currentTime;
        if (typeof t !== 'number') return;
        const idx = cueTimes.findIndex((c) => t >= c.start && t < c.end);
        if (idx !== activeIndex) {
          activeIndex = idx;
          document
            .getElementById(`cue-${idx}`)
            ?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
        }
      }, 250);
    } else if (data.data.transcript?.transcription) {
      const { default: Quill } = await import('quill');

      quill = new Quill(editor, {
        modules: {
          toolbar: false,
        },
        theme: 'snow',
        readOnly: true,
      });

      quill.clipboard.dangerouslyPasteHTML(data.data.transcript.transcription as string);
    }
  });
</script>

<svelte:head>
  <link href="https://cdn.jsdelivr.net/npm/quill@2.0.2/dist/quill.snow.css" rel="stylesheet" />
</svelte:head>

{#key $page.params}
  <div class="mx-auto w-full max-w-[1400px] p-4 md:p-8">
    <nav class="muted mb-5 flex flex-wrap items-center gap-1.5 text-sm" aria-label="Caminho">
      <a href="/app" class="hover:underline">Biblioteca</a>
      <span aria-hidden="true">/</span>
      <a href={`/app/course/byId/${data.idbook}`} class="hover:underline">{data.book}</a>
      <span aria-hidden="true">/</span>
      <a
        href={`/app/series/byId/${data.idstudies}?book=${data.book}&idbook=${data.idbook}`}
        class="hover:underline">{data.studies}</a
      >
    </nav>

    <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)]">
      <!-- Detalhes -->
      <section class="card h-fit p-5">
        {#if isVideo}
          <!-- svelte-ignore a11y-media-has-caption -->
          <video bind:this={videoEl} controls preload="metadata" class="aspect-video w-full rounded-xl bg-black" src={data.data.audiofile} poster={data.data.photoLeson} aria-label="Player de vídeo" data-testid="player-video"></video>
        {:else}
          <div class="aspect-video w-full overflow-hidden rounded-xl bg-slate-200 dark:bg-slate-800">
            <img alt="" src={data.data.photoLeson} class="h-full w-full object-cover" />
          </div>
        {/if}
        <h1 class="mt-4 text-xl font-bold tracking-tight">{data.data.title}</h1>
        <p class="muted mt-1 text-sm">{data.book} · {data.studies}</p>
        {#if data.data.description}
          <div class="mt-4 flex items-center gap-2 text-sm font-semibold">
            <DescriptionIcon size="16" /> Descrição
          </div>
          <p class="muted mt-1 text-sm leading-relaxed">{data.data.description}</p>
        {/if}
      </section>

      <!-- Transcrição -->
      <section class="card flex min-h-[420px] flex-col p-5">
        <div class="mb-4 flex items-center justify-between">
          <h2 class="flex items-center gap-2 text-base font-semibold">
            <TranscribeIcon size="17" /> Transcrição
          </h2>
          {#if cues.length && !editing}
            <span class="muted text-xs">Clique em um trecho para ir ao momento</span>
          {/if}
        </div>

        {#if cues.length}
          <div class="mb-3 flex flex-wrap items-center gap-2" data-testid="acoes-transcricao">
            <span class="muted text-xs">Baixar:</span>
            {#each ['txt', 'srt', 'vtt'] as f}
              <a class="btn btn-sm variant-ringed" href={exportHref(f)} download>{f.toUpperCase()}</a>
            {/each}
            {#if data.isAdmin}
              <span class="ml-auto flex gap-2">
                <button type="button" class="btn btn-sm variant-ringed" on:click={() => (sharing = true)}>Compartilhar</button>
                <button type="button" class="btn btn-sm variant-ringed" on:click={() => (showTimeline = !showTimeline)} aria-expanded={showTimeline}>Histórico</button>
                {#if !editing}<button type="button" class="btn btn-sm variant-filled-primary" on:click={() => (editing = true)}>Editar trechos</button>{/if}
              </span>
            {/if}
          </div>
          {#if savedNotice}<p class="mb-2 text-sm text-success-500" role="status">{savedNotice}</p>{/if}
          {#if showTimeline && data.isAdmin}
            <div class="mb-4 rounded-xl border p-3" style="border-color: rgb(var(--cp-border))"><Timeline {lessonId} /></div>
          {/if}
        {/if}

        {#if cues.length && editing}
          <CueEditor {cues} {lessonId} on:saved={onSaved} on:cancel={() => (editing = false)} />
        {:else if cues.length}
          <ol class="max-h-[60vh] space-y-1 overflow-y-auto pr-1">
            {#each cues as cue, i}
              <li id={`cue-${i}`}>
                <button
                  type="button"
                  class="cue {activeIndex === i ? 'cue-active' : ''}"
                  on:click={() => seek(i)}
                >
                  <span class="cue-time"><Icon name="clock" size={12} />{formatTimestamp(cue.startMs).slice(0, 8)}</span>
                  <span class="text-left">{cue.text}</span>
                </button>
              </li>
            {/each}
          </ol>
        {:else if data.data.transcript !== null}
          <div class="rounded-xl border p-2" style="border-color: rgb(var(--cp-border))">
            <div bind:this={editor} class="min-h-[360px]"></div>
          </div>
        {:else}
          <div class="flex flex-1 flex-col items-center justify-center text-center">
            <p class="text-lg font-semibold">Nenhuma transcrição disponível</p>
            <p class="muted mt-1 max-w-sm text-sm">
              Peça a um administrador para transcrever esta aula. Você acompanha o progresso na
              lista de aulas.
            </p>
          </div>
        {/if}
      </section>
    </div>
  </div>
{/key}

<style>
  .cue {
    display: flex;
    width: 100%;
    gap: 0.75rem;
    align-items: baseline;
    border-radius: 10px;
    padding: 0.5rem 0.75rem;
    font-size: 0.9rem;
    line-height: 1.5;
    transition: background-color 0.15s;
  }
  .cue:hover {
    background-color: rgb(var(--cp-surface-2));
  }
  .cue-active {
    background-color: rgb(var(--color-primary-500) / 0.12);
    box-shadow: inset 3px 0 0 rgb(var(--color-primary-500));
  }
  .cue-time {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    gap: 0.25rem;
    font-variant-numeric: tabular-nums;
    font-size: 0.75rem;
    color: rgb(var(--cp-muted));
  }
</style>

{#if sharing}
  <ShareDialog {lessonId} title={data.data.title} on:close={() => (sharing = false)} />
{/if}
