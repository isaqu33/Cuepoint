<script lang="ts">
  import { goto } from '$app/navigation';
  import { openDrawer } from '$lib/stores/drawer';
  import Icon from '$lib/components/shell/Icon.svelte';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';
  import EmptyState from '$lib/components/ui/EmptyState.svelte';
  import Pagination from '$lib/components/ui/Pagination.svelte';
  import RowActions from '$lib/components/ui/RowActions.svelte';
  import type { CustomPageData } from './types';

  export let data: CustomPageData;
  $: if (data?.data?.length === 0 && Number(data?.page) > 0) goto('/admin/users?page=0');
</script>

<PageHeader title="Membros" description="Pessoas com acesso ao Cuepoint. Convide, edite o perfil e bloqueie quando precisar.">
  <button class="btn btn-sm variant-filled-primary gap-1.5" on:click={() => openDrawer('Novo membro', '/admin/users/create')}>
    <Icon name="plus" size={16} />Novo membro
  </button>
</PageHeader>

{#if !data?.data?.length}
  <div class="panel"><EmptyState icon="users" title="Nenhum membro" description="Convide a primeira pessoa da sua equipe." /></div>
{:else}
  <div class="table-container">
    <table class="table table-hover w-full">
      <thead>
        <tr><th>Nome</th><th>E-mail</th><th>Perfil</th><th>Acesso</th><th><span class="sr-only">Ações</span></th></tr>
      </thead>
      <tbody>
        {#each data.data as row (row.id)}
          <tr>
            <td class="font-medium">{row.name}</td>
            <td class="muted text-sm">{row.email}</td>
            <td>{row.isAdmin ? 'Administrador' : 'Membro'}</td>
            <td><span class="pill {row.isBlocked ? 'pill-failed' : 'pill-ready'}">{row.isBlocked ? 'Bloqueado' : 'Ativo'}</span></td>
            <td>
              <RowActions
                id={row.id}
                editSrc={`/admin/users/update/${row.id}`}
                editTitle="Editar membro"
                items={[
                  { label: 'Enviar e-mail de boas-vindas', icon: 'mail', action: 'sendEmailUserWelcome', confirm: 'O membro recebe um e-mail para ativar a conta.', confirmLabel: 'Enviar' },
                  { label: 'Enviar redefinição de senha', icon: 'key', action: 'sendEmailUserChangePassword', confirm: 'O membro recebe um link para criar uma nova senha.', confirmLabel: 'Enviar' },
                  row.isBlocked
                    ? { label: 'Desbloquear', icon: 'unlock', action: 'lockUnlockUserAction', confirm: 'O membro volta a ter acesso.', confirmLabel: 'Desbloquear' }
                    : { label: 'Bloquear', icon: 'lock', action: 'lockUnlockUserAction', danger: true, confirm: 'O membro perde o acesso até ser desbloqueado.', confirmLabel: 'Bloquear' },
                ]}
              />
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
  <Pagination page={Number(data.page ?? 0)} total={data.totalNumbersPagination} basePath="/admin/users" />
{/if}
