<script lang="ts">
  import { goto } from '$app/navigation';
  import { openDrawer } from '$lib/stores/drawer';
  import Icon from '$lib/components/shell/Icon.svelte';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import RowActions from '$lib/components/ui/RowActions.svelte';
  import Thumb from '$lib/components/ui/Thumb.svelte';
  import type { CustomPageData } from './types';

  export let data: CustomPageData;

  $: if (data?.data?.length === 0 && Number(data?.page) > 0) goto('/admin/series?page=0');
</script>

<PageHeader
  title="Subcoleções"
  description="Agrupam arquivos dentro de uma coleção, como uma playlist ou uma temporada."
>
  <button class="btn btn-sm variant-filled-primary gap-1.5" on:click={() => openDrawer('Nova subcoleção', '/admin/series/create')}>
    <Icon name="plus" size={16} />Nova subcoleção
  </button>
</PageHeader>

{#if !data.data?.length}
  <div class="panel">
    <EmptyState icon="series" title="Nenhuma subcoleção" description="Crie a primeira para organizar seus arquivos.">
      <button class="btn btn-sm variant-filled-primary mt-2 gap-1.5" on:click={() => openDrawer('Nova subcoleção', '/admin/series/create')}>
        <Icon name="plus" size={16} />Nova subcoleção
      </button>
    </EmptyState>
  </div>
{:else}
  <div class="table-container">
    <table class="table table-hover w-full">
      <thead>
        <tr><th>Subcoleção</th><th>Coleções</th><th>Status</th><th><span class="sr-only">Ações</span></th></tr>
      </thead>
      <tbody>
        {#each data.data as row (row.id)}
          <tr>
            <td><div class="flex items-center gap-3"><Thumb src={row.photoLeson} icon="series" /><span class="font-medium">{row.title}</span></div></td>
            <td class="muted text-sm">
              {#if !row.courses?.length}
                Sem coleção
              {:else}
                {row.courses[0].title}{row.courses.length > 1 ? ` +${row.courses.length - 1}` : ''}
              {/if}
            </td>
            <td>
              <span class="pill {row.isPublished ? 'pill-ready' : 'pill-idle'}">{row.isPublished ? 'Publicada' : 'Rascunho'}</span>
            </td>
            <td>
              <RowActions
                id={row.id}
                editSrc={`/admin/series/update/${row.id}`}
                editTitle="Editar subcoleção"
                items={[
                  row.isPublished
                    ? { label: 'Despublicar', icon: 'eyeoff', action: 'unPublishAction', confirm: 'A subcoleção deixa de aparecer na biblioteca.', confirmLabel: 'Despublicar' }
                    : { label: 'Publicar', icon: 'eye', action: 'publishAction', confirm: 'A subcoleção passa a aparecer na biblioteca.', confirmLabel: 'Publicar' },
                  { label: 'Excluir', icon: 'trash', action: 'deleteAction', danger: true, confirm: 'Esta ação não pode ser desfeita.', confirmLabel: 'Excluir' },
                ]}
              />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <Pagination page={Number(data.page ?? 0)} total={data.totalNumbersPagination} basePath="/admin/series" />
{/if}
