<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { io } from 'socket.io-client';
  import { invalidateAll } from '$app/navigation';
  import { goto } from '$app/navigation';
  import { openDrawer } from '$lib/stores/drawer';
  import Icon from '$lib/components/shell/Icon.svelte';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import RowActions from '$lib/components/ui/RowActions.svelte';
  import Thumb from '$lib/components/ui/Thumb.svelte';
  import ShareDialog from '$lib/components/ui/ShareDialog.svelte';
  import StatusPill from '$lib/components/StatusPill.svelte';
  import type { CustomPageData } from './types';

  export let data: CustomPageData;

  let live: Record<string, number> = {};
  let sharing: { id: string; title: string } | null = null;
  let timer: ReturnType<typeof setInterval>;
  let socket: ReturnType<typeof io> | undefined;

  $: if (data?.data?.length === 0 && Number(data?.page) > 0) goto('/admin/lessons?page=0');

  const busy = () => data.data.some((r) => r.haveAnyTasncriptInProgresse);
  onMount(() => {
    timer = setInterval(() => busy() && invalidateAll(), 4000);
    if (data.wsRouter) {
      socket = io(data.wsRouter as unknown as string);
      socket.on('progresso', (p: { lessonId: string; porcentagem: number }) => (live = { ...live, [p.lessonId]: p.porcentagem }));
    }
  });
  onDestroy(() => {
    clearInterval(timer);
    socket?.disconnect();
  });
</script>

<PageHeader title="Arquivos" description="Seus áudios e vídeos. Envie, organize em subcoleções e peça a transcrição.">
  <button class="btn btn-sm variant-ringed gap-1.5" on:click={() => openDrawer('Envio em lote', '/admin/lessons/batch')}>
    <Icon name="plus" size={16} />Envio em lote
  </button>
  <button class="btn btn-sm variant-filled-primary gap-1.5" on:click={() => openDrawer('Novo arquivo', '/admin/lessons/create')}>
    <Icon name="plus" size={16} />Novo arquivo
  </button>
</PageHeader>

{#if !data.data?.length}
  <div class="panel">
    <EmptyState icon="file" title="Nenhum arquivo" description="Envie o primeiro áudio para ver a fila e a transcrição funcionando.">
      <button class="btn btn-sm variant-filled-primary mt-2 gap-1.5" on:click={() => openDrawer('Novo arquivo', '/admin/lessons/create')}>
        <Icon name="plus" size={16} />Novo arquivo
      </button>
    </EmptyState>
  </div>
{:else}
  <div class="table-container">
    <table class="table table-hover w-full">
      <thead>
        <tr><th>Arquivo</th><th>Subcoleções</th><th>Publicação</th><th>Transcrição</th><th><span class="sr-only">Ações</span></th></tr>
      </thead>
      <tbody>
        {#each data.data as row (row.id)}
          {@const inProgress = row.haveAnyTasncriptInProgresse}
          <tr>
            <td><div class="flex items-center gap-3"><Thumb src={row.photoLeson} icon="file" /><span class="font-medium">{row.title}</span></div></td>
            <td class="muted text-sm">
              {#if !row.series?.length}Sem subcoleção{:else}{row.series[0].title}{row.series.length > 1 ? ` +${row.series.length - 1}` : ''}{/if}
            </td>
            <td><span class="pill {row.isPublished ? 'pill-ready' : 'pill-idle'}">{row.isPublished ? 'Publicado' : 'Rascunho'}</span></td>
            <td>
              <div class="flex items-center gap-3">
                <span title={row.transcriptionError ?? ''}><StatusPill status={row.transcript ? 'READY' : row.transcriptionStatus} /></span>
                {#if row.transcriptionStatus === 'PROCESSING' && !row.transcript}
                  <span class="muted text-xs tabular-nums">{live[row.id] ?? row.transcriptionProgress}%</span>
                {/if}
              </div>
            </td>
            <td class="whitespace-nowrap">
              <button type="button" class="icon-btn" aria-label={`Compartilhar ${row.title}`} title="Compartilhar" on:click={() => (sharing = { id: row.id, title: row.title })}>
                <Icon name="link" size={16} />
              </button>
              <RowActions
                id={row.id}
                editSrc={`/admin/lessons/update/${row.id}`}
                editTitle="Editar arquivo"
                items={[
                  {
                    label: row.transcriptionStatus === 'FAILED' ? 'Tentar transcrever de novo' : 'Transcrever',
                    icon: row.transcriptionStatus === 'FAILED' ? 'refresh' : 'mic',
                    action: 'trascriptFile',
                    hidden: !!row.transcript || inProgress || !row.audiofile,
                    confirm: 'O áudio entra na fila e será transcrito em segundo plano. Você acompanha em Processamento.',
                    confirmLabel: 'Transcrever',
                  },
                  row.isPublished
                    ? { label: 'Despublicar', icon: 'eyeoff', action: 'unPublishAction', confirm: 'O arquivo deixa de aparecer na biblioteca.', confirmLabel: 'Despublicar' }
                    : { label: 'Publicar', icon: 'eye', action: 'publishAction', confirm: 'O arquivo passa a aparecer na biblioteca.', confirmLabel: 'Publicar' },
                  { label: 'Excluir', icon: 'trash', action: 'deleteAction', danger: true, disabled: inProgress, confirm: 'O arquivo e a transcrição são removidos. Esta ação não pode ser desfeita.', confirmLabel: 'Excluir' },
                ]}
              />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <Pagination page={Number(data.page ?? 0)} total={data.totalNumbersPagination} basePath="/admin/lessons" />
{/if}

{#if sharing}
  <ShareDialog lessonId={sharing.id} title={sharing.title} on:close={() => (sharing = null)} />
{/if}
