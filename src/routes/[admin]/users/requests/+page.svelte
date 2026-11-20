<script lang="ts">
  import { goto } from '$app/navigation';
  import { getModalStore } from '@skeletonlabs/skeleton';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import RowActions from '$lib/components/ui/RowActions.svelte';
  import ModalAccountRequest from '$lib/components/ModalAccountRequest.svelte';
  import Icon from '$lib/components/shell/Icon.svelte';
  import type { CustomPageData } from '../types';

  export let data: CustomPageData;
  const modalStore = getModalStore();

  $: if (data?.data?.length === 0 && Number(data?.page) > 0) goto('/admin/users/requests?page=0');

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const details = (row: any) =>
    modalStore.trigger({
      type: 'component',
      meta: data.language,
      component: { ref: ModalAccountRequest, props: { name: row.name, email: row.email, request: row.request } },
    });
</script>

<PageHeader title="Solicitações" description="Pedidos de acesso enviados pela tela de entrada. Leia a mensagem e convide a pessoa em Membros." />

{#if !data?.data?.length}
  <div class="panel"><EmptyState icon="inbox" title="Nenhuma solicitação" description="Quando alguém pedir acesso, o pedido aparece aqui." /></div>
{:else}
  <div class="table-container">
    <table class="table table-hover w-full">
      <thead>
        <tr><th>Nome</th><th>E-mail</th><th>Mensagem</th><th><span class="sr-only">Ações</span></th></tr>
      </thead>
      <tbody>
        {#each data.data as row (row.id)}
          <tr>
            <td class="font-medium">{row.name}</td>
            <td class="muted text-sm">{row.email}</td>
            <td class="muted max-w-xs truncate text-sm">{row.request}</td>
            <td>
              <div class="flex items-center justify-end gap-1">
                <button type="button" class="row-btn" title="Ver detalhes" aria-label="Ver detalhes" on:click={() => details(row)}>
                  <Icon name="search" size={16} />
                </button>
                <RowActions
                  id={row.id}
                  items={[
                    { label: 'Excluir solicitação', icon: 'trash', action: 'deleteAccountRequest', danger: true, confirm: 'A solicitação é removida. Esta ação não pode ser desfeita.', confirmLabel: 'Excluir' },
                  ]}
                />
              </div>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <Pagination page={Number(data.page ?? 0)} total={data.totalNumbersPagination} basePath="/admin/users/requests" />
{/if}
