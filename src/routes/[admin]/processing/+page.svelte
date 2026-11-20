<script lang="ts">
  import { eventDetail, eventLabel } from '$lib/utils/event-labels';
  import { onMount, onDestroy } from 'svelte';
  import { enhance } from '$app/forms';
  import { invalidateAll } from '$app/navigation';
  import { io } from 'socket.io-client';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import Icon from '$lib/components/shell/Icon.svelte';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let data: any;

  let live: Record<string, number> = {};
  type Activity = { id: string; type: string; lessonId: string; title: string; occurredAt: string; data: Record<string, unknown> };
  let feed: Activity[] = [];
  $: feed = data.activity;
  let timer: ReturnType<typeof setInterval>;
  let socket: ReturnType<typeof io> | undefined;
  /** Conexão ao vivo ativa (o feed recebe eventos sem recarregar). */
  let liveOn = false;

  const active = () => data.jobs.some((j: { transcriptionStatus: string }) =>
    ['QUEUED', 'PROCESSING'].includes(j.transcriptionStatus));

  onMount(() => {
    // Estado persistido é a fonte da verdade; o socket só dá fluidez ao progresso.
    // O tópico de eventos é a via principal; o polling lento só cobre uma conexão caída.
    timer = setInterval(() => active() && invalidateAll(), 10000);
    if (data.realtimeUrl) {
      socket = io(data.realtimeUrl);
      socket.on('connect', () => (liveOn = true));
      socket.on('disconnect', () => (liveOn = false));
      socket.on('progresso', (p: { lessonId: string; porcentagem: number }) => {
        live = { ...live, [p.lessonId]: p.porcentagem };
      });
      // Evento de domínio (fato): entra no feed na hora e atualiza a fila.
      socket.on('evento', (ev: { id: string; type: string; aggregateId: string; occurredAt: string; data: Record<string, unknown> }) => {
        if (ev.type === 'media.transcription.progress' || ev.type === 'media.transcription.cue') return;
        const title = data.jobs.find((j: { id: string }) => j.id === ev.aggregateId)?.title ?? 'Arquivo';
        if (!feed.some((f) => f.id === ev.id)) {
          feed = [{ id: ev.id, type: ev.type, lessonId: ev.aggregateId, title, occurredAt: ev.occurredAt, data: ev.data }, ...feed].slice(0, 15);
        }
        void invalidateAll();
      });
    }
  });
  onDestroy(() => {
    clearInterval(timer);
    socket?.disconnect();
  });

  const summary = [
    { key: 'QUEUED', label: 'Na fila' },
    { key: 'PROCESSING', label: 'Processando' },
    { key: 'READY', label: 'Prontos' },
    { key: 'FAILED', label: 'Com falha' },
  ];
  const pct = (j: { id: string; transcriptionProgress: number }) => live[j.id] ?? j.transcriptionProgress;
  const detail = (a: Activity) => eventDetail(a.type, a.data);
  const when = (d: string | Date) =>
    new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });
</script>

<PageHeader title="Processamento" description="Acompanhe a fila, o progresso de cada arquivo e reprocesse o que falhou." />

<section class="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
  {#each summary as s}
    <div class="panel stat">
      <span class="stat-label">{s.label}</span>
      <span class="stat-value {s.key === 'FAILED' && data.counts.FAILED > 0 ? 'text-error-500' : ''}">
        {data.counts[s.key]}
      </span>
    </div>
  {/each}
</section>

{#if data.jobs.length === 0}
  <div class="panel flex flex-col items-center gap-2 p-12 text-center">
    <p class="text-lg font-semibold">Nada em processamento</p>
    <p class="page-sub max-w-md">
      Em <a class="anchor" href="/admin/lessons">Arquivos</a>, peça a transcrição de um áudio e ele
      aparece aqui.
    </p>
  </div>
{:else}
  <div class="panel divide-y overflow-hidden" style="--tw-divide-opacity: 1">
    {#each data.jobs as job (job.id)}
      <div class="flex flex-wrap items-center gap-4 px-5 py-4" style="border-color: rgb(var(--cp-border))">
        <div class="min-w-0 flex-1">
          <a href={`/app/lesson/${job.id}`} class="block truncate text-sm font-semibold hover:underline"
            >{job.title}</a
          >
          <p class="muted mt-0.5 text-xs">Atualizado em {when(job.updatedAt)}</p>
          {#if job.transcriptionStatus === 'FAILED' && job.transcriptionError}
            <p class="mt-1 line-clamp-2 text-xs text-error-500">{job.transcriptionError}</p>
          {/if}
        </div>

        <div class="w-40">
          {#if job.transcriptionStatus === 'PROCESSING'}
            <div class="progress"><span style="width: {pct(job)}%"></span></div>
            <p class="muted mt-1 text-right text-xs tabular-nums">{pct(job)}%</p>
          {/if}
        </div>

        <StatusPill status={job.transcriptionStatus} />

        <div class="w-28 text-right">
          {#if job.transcriptionStatus === 'FAILED'}
            <form
              method="POST"
              action="/admin/lessons?/trascriptFile"
              use:enhance={({ formData }) => {
                formData.append('LessonSelected', job.id);
                return async () => {
                  await invalidateAll();
                };
              }}
            >
              <button class="btn btn-sm variant-ringed gap-1.5">
                <Icon name="refresh" size={14} />Reprocessar
              </button>
            </form>
          {/if}
        </div>
      </div>
    {/each}
  </div>
{/if}

<section class="mt-10" aria-labelledby="atividade-titulo">
  <h2 id="atividade-titulo" class="mb-3 text-base font-semibold">Atividade recente</h2>
  {#if feed.length === 0}
    <div class="panel"><p class="page-sub p-6 text-center">Nenhum evento ainda. Peça uma transcrição para ver o histórico aqui.</p></div>
  {:else}
    <ul class="panel divide-y overflow-hidden" data-testid="atividade" data-live={liveOn}>
      {#each feed as item (item.id)}
        <li class="flex flex-wrap items-center gap-3 px-5 py-3 text-sm" style="border-color: rgb(var(--cp-border))">
          <span class="pill {eventLabel(item.type).tone}">{eventLabel(item.type).text}</span>
          <a href={`/app/lesson/${item.lessonId}`} class="min-w-0 flex-1 truncate font-medium hover:underline">{item.title}</a>
          <span class="muted text-xs">{detail(item)}</span>
          <span class="muted text-xs tabular-nums">{when(item.occurredAt)}</span>
        </li>
      {/each}
    </ul>
  {/if}
</section>
