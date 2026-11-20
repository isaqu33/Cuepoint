<script lang="ts">
  import { goto } from '$app/navigation';
  import Field from '$lib/components/ui/Field.svelte';

  export let data: { id: string; name: string; maxFiles: number | null; maxStorageMB: number | null };

  let name = data.name;
  let maxFiles = data.maxFiles === null ? '' : String(data.maxFiles);
  let maxStorageMB = data.maxStorageMB === null ? '' : String(data.maxStorageMB);
  let errors: Record<string, string> = {};
  let apiError = '';
  let busy = false;
  const num = (v: string) => (v.trim() === '' ? null : Number(v));

  async function submit() {
    errors = {};
    apiError = '';
    if (name.trim().length < 2) errors.name = 'Informe o nome do espaço';
    for (const [k, v] of [['maxFiles', maxFiles], ['maxStorageMB', maxStorageMB]] as const) {
      const n = num(v);
      if (n !== null && (!Number.isInteger(n) || n < 1)) errors[k] = 'Use um número inteiro maior que zero (ou deixe em branco)';
    }
    if (Object.keys(errors).length) return;
    busy = true;
    const res = await fetch(`/api/workspaces/${data.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, maxFiles: num(maxFiles), maxStorageMB: num(maxStorageMB) }),
    });
    busy = false;
    if (!res.ok) {
      apiError = (await res.json().catch(() => ({}))).error ?? 'Não foi possível salvar';
      return;
    }
    goto('/admin/workspaces');
  }
</script>

<div class="form-page">
  <div class="form-title"><h1 class="page-title">Editar espaço</h1></div>
  <form class="form-shell" on:submit|preventDefault={submit}>
    <div class="form-body">
      <Field label="Nome do espaço" id="ws-name" required error={errors.name ?? ''}>
        <input class="input" id="ws-name" bind:value={name} autocomplete="off" />
      </Field>
      <div class="form-grid">
        <Field label="Limite de arquivos" id="ws-files" error={errors.maxFiles ?? ''} hint="Em branco = sem limite.">
          <input class="input" id="ws-files" bind:value={maxFiles} inputmode="numeric" />
        </Field>
        <Field label="Limite de armazenamento (MB)" id="ws-mb" error={errors.maxStorageMB ?? ''} hint="Em branco = sem limite.">
          <input class="input" id="ws-mb" bind:value={maxStorageMB} inputmode="numeric" />
        </Field>
      </div>
      {#if apiError}<p class="text-sm text-error-500" role="alert">{apiError}</p>{/if}
    </div>
    <footer class="form-footer">
      <a href="/admin/workspaces?cancelled=1" class="btn btn-sm variant-ringed">Cancelar</a>
      <button class="btn btn-sm variant-filled-primary min-w-24" disabled={busy}>{busy ? 'Salvando…' : 'Salvar'}</button>
    </footer>
  </form>
</div>
