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

  $: if (data?.data?.length === 0 && Number(data?.page) > 0) goto('/admin/courses?page=0');
</script>

<PageHeader title="Coleções" description="O nível mais alto da biblioteca. Reúnem subcoleções e arquivos de um mesmo tema.">
  <button class="btn btn-sm variant-filled-primary gap-1.5" on:click={() => openDrawer('Nova coleção', '/admin/courses/create')}>
    <Icon name="plus" size={16} />Nova coleção
  </button>
</PageHeader>

{#if !data.data?.length}
  <div class="panel">
    <EmptyState icon="folder" title="Nenhuma coleção" description="Crie a primeira para começar a organizar a biblioteca.">
      <button class="btn btn-sm variant-filled-primary mt-2 gap-1.5" on:click={() => openDrawer('Nova coleção', '/admin/courses/create')}>
        <Icon name="plus" size={16} />Nova coleção
      </button>
    </EmptyState>
  </div>
{:else}
  <div class="table-container">
    <table class="table table-hover w-full">
      <thead>
        <tr><th>Coleção</th><th>Status</th><th><span class="sr-only">Ações</span></th></tr>
      </thead>
      <tbody>
        {#each data.data as row (row.id)}
          <tr>
            <td><div class="flex items-center gap-3"><Thumb src={row.photoLeson} icon="folder" /><span class="font-medium">{row.title}</span></div></td>
            <td><span class="pill {row.isPublished ? 'pill-ready' : 'pill-idle'}">{row.isPublished ? 'Publicada' : 'Rascunho'}</span></td>
            <td>
              <RowActions
                id={row.id}
                editSrc={`/admin/courses/update/${row.id}`}
                editTitle="Editar coleção"
                items={[
                  row.isPublished
                    ? { label: 'Despublicar', icon: 'eyeoff', action: 'unPublishAction', confirm: 'A coleção deixa de aparecer na biblioteca.', confirmLabel: 'Despublicar' }
                    : { label: 'Publicar', icon: 'eye', action: 'publishAction', confirm: 'A coleção passa a aparecer na biblioteca.', confirmLabel: 'Publicar' },
                  { label: 'Excluir', icon: 'trash', action: 'deleteAction', danger: true, confirm: 'Esta ação não pode ser desfeita.', confirmLabel: 'Excluir' },
                ]}
              />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <Pagination page={Number(data.page ?? 0)} total={data.totalNumbersPagination} basePath="/admin/courses" />
{/if}
