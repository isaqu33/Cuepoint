<script lang="ts">
  import CardApp from '$lib/components/CardApp.svelte';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import { brand } from '$lib/brand';
  import type { CustomPageData } from './types';

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  export let data: CustomPageData & { stats: any; recent: any[] };

  const stats = [
    { key: 'total', label: 'Arquivos' },
    { key: 'ready', label: 'Transcritos' },
    { key: 'inProgress', label: 'Em processamento' },
    { key: 'failed', label: 'Com falha' },
  ];
</script>

<div class="mx-auto w-full max-w-[1400px] space-y-10 p-4 md:p-8">
  <header>
    <h1 class="page-title">Biblioteca</h1>
    <p class="page-sub mt-1">{brand.message}</p>
  </header>

  <section class="grid grid-cols-2 gap-4 lg:grid-cols-4" aria-label="Resumo">
    {#each stats as s}
      <div class="panel stat">
        <span class="stat-label">{s.label}</span>
        <span
          class="stat-value {s.key === 'failed' && data.stats[s.key] > 0 ? 'text-error-500' : ''}"
          >{data.stats[s.key]}</span
        >
      </div>
    {/each}
  </section>

  {#if data.stats.total === 0 && data.books.length === 0}
    <div class="panel flex flex-col items-center gap-2 p-12 text-center">
      <p class="text-lg font-semibold">Sua biblioteca está vazia</p>
      <p class="page-sub max-w-md">
        Envie o primeiro arquivo de áudio para ver o processamento e a revisão acontecendo.
      </p>
    </div>
  {/if}

  {#if data.recent.length}
    <section>
      <h2 class="mb-4 text-base font-semibold">Arquivos recentes</h2>
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {#each data.recent as file}
          <a href={`/app/lesson/${file.id}`} class="panel card-hover group flex flex-col overflow-hidden">
            <div class="aspect-[16/9] w-full overflow-hidden" style="background: rgb(var(--cp-surface-2))">
              {#if file.photoLeson}
                <img
                  src={file.photoLeson}
                  alt=""
                  loading="lazy"
                  class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              {/if}
            </div>
            <div class="flex flex-1 flex-col gap-2 p-4">
              <h3 class="line-clamp-1 text-sm font-semibold">{file.title}</h3>
              <p class="muted line-clamp-1 text-xs">
                {file.courses[0]?.title ?? 'Sem coleção'}{file.series[0] ? ` · ${file.series[0].title}` : ''}
              </p>
              <div class="mt-auto pt-1"><StatusPill status={file.transcriptionStatus} /></div>
            </div>
          </a>
        {/each}
      </div>
    </section>
  {/if}

  {#if data.books.length}
    <section>
      <h2 class="mb-4 text-base font-semibold">Coleções</h2>
      <div class="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
        {#each data.books as course}
          <CardApp
            dataInformation={{
              id: course.id,
              router: `/app/course/byId/${course.id}`,
              photo: course.photoLeson,
              language: data.language,
              title: course.title,
              about: course.about,
            }}
          ></CardApp>
        {/each}
      </div>
    </section>
  {/if}
</div>
