<script lang="ts">
  import { openDrawer } from '$lib/stores/drawer';
  import Icon from '$lib/components/shell/Icon.svelte';
  import PageHeader from '$lib/components/ui/PageHeader.svelte';

  export let data: {
    workspaces: { id: string; name: string; slug: string; maxFiles: number | null; maxStorageBytes: number | null; files: number; storageBytes: number; members: number }[];
  };

  const mb = (n: number) => `${(n / 1024 ** 2).toFixed(1)} MB`;
  const pct = (used: number, max: number | null) => (max ? Math.min(100, Math.round((used / max) * 100)) : 0);
</script>

<PageHeader title="Espaços de trabalho" description="Cada espaço é isolado dos outros: arquivos, coleções e membros não se misturam. Defina limites de arquivos e armazenamento.">
  <button class="btn btn-sm variant-filled-primary gap-1.5" on:click={() => openDrawer('Novo espaço', '/admin/workspaces/create')}>
    <Icon name="plus" size={16} />Novo espaço
  </button>
</PageHeader>

<div class="table-container" data-testid="espacos">
  <table class="table table-hover w-full">
    <thead><tr><th>Espaço</th><th>Membros</th><th>Arquivos</th><th>Armazenamento</th><th><span class="sr-only">Ações</span></th></tr></thead>
    <tbody>
      {#each data.workspaces as w (w.id)}
        <tr data-slug={w.slug}>
          <td><span class="font-medium">{w.name}</span><br /><span class="muted text-xs">{w.slug}</span></td>
          <td class="tabular-nums">{w.members}</td>
          <td>
            <span class="tabular-nums">{w.files}{w.maxFiles ? ` / ${w.maxFiles}` : ''}</span>
            {#if w.maxFiles}<div class="meter" role="meter" aria-label={`Arquivos de ${w.name}`} aria-valuemin="0" aria-valuemax={w.maxFiles} aria-valuenow={w.files}><span style={`width:${pct(w.files, w.maxFiles)}%`}></span></div>{/if}
          </td>
          <td>
            <span class="tabular-nums">{mb(w.storageBytes)}{w.maxStorageBytes ? ` / ${mb(w.maxStorageBytes)}` : ''}</span>
            {#if w.maxStorageBytes}<div class="meter" role="meter" aria-label={`Armazenamento de ${w.name}`} aria-valuemin="0" aria-valuemax={w.maxStorageBytes} aria-valuenow={w.storageBytes}><span style={`width:${pct(w.storageBytes, w.maxStorageBytes)}%`}></span></div>{/if}
          </td>
          <td class="text-right"><button class="btn btn-sm variant-ringed" on:click={() => openDrawer('Editar espaço', `/admin/workspaces/update/${w.id}`)}>Editar limites</button></td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  .meter { height: 6px; width: 8rem; margin-top: 0.35rem; border-radius: 999px; background: rgb(var(--cp-surface-2)); overflow: hidden; }
  .meter > span { display: block; height: 100%; background: rgb(var(--color-primary-500)); }
</style>
