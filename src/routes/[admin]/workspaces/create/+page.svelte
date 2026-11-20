<script lang="ts">
  import { goto } from '$app/navigation';
  import Field from '$lib/components/ui/Field.svelte';

  let name = '';
  let maxFiles = '';
  let maxStorageMB = '';
  let adminName = '';
  let adminEmail = '';
  let adminPassword = '';
  let errors: Record<string, string> = {};
  let busy = false;
  let apiError = '';

  const num = (v: string) => (v.trim() === '' ? null : Number(v));

  async function submit() {
    errors = {};
    apiError = '';
    if (name.trim().length < 2) errors.name = 'Informe o nome do espaço';
    if (adminName.trim().length < 2) errors.adminName = 'Informe o nome do administrador';
    if (!/^\S+@\S+\.\S+$/.test(adminEmail.trim())) errors.adminEmail = 'Informe um e-mail válido';
    if (adminPassword.length < 8) errors.adminPassword = 'A senha precisa de ao menos 8 caracteres';
    for (const [k, v] of [['maxFiles', maxFiles], ['maxStorageMB', maxStorageMB]] as const) {
      const n = num(v);
      if (n !== null && (!Number.isInteger(n) || n < 1)) errors[k] = 'Use um número inteiro maior que zero (ou deixe em branco)';
    }
    if (Object.keys(errors).length) return;
    busy = true;
    const res = await fetch('/api/workspaces', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, maxFiles: num(maxFiles), maxStorageMB: num(maxStorageMB),
        admin: { name: adminName, email: adminEmail, password: adminPassword },
      }),
    });
    const body = await res.json().catch(() => ({}));
    busy = false;
    if (!res.ok) {
      apiError = body.error ?? 'Não foi possível criar o espaço';
      return;
    }
    goto('/admin/workspaces'); // sair de /create faz o painel fechar, atualizar a lista e avisar
  }
</script>

<div class="form-page">
  <div class="form-title"><h1 class="page-title">Novo espaço</h1></div>
  <form class="form-shell" on:submit|preventDefault={submit}>
    <div class="form-body">
      <Field label="Nome do espaço" id="ws-name" required error={errors.name ?? ''}>
        <input class="input" id="ws-name" bind:value={name} autocomplete="off" placeholder="Ex.: Igreja Central" />
      </Field>
      <div class="form-grid">
        <Field label="Limite de arquivos" id="ws-files" error={errors.maxFiles ?? ''} hint="Em branco = sem limite.">
          <input class="input" id="ws-files" bind:value={maxFiles} inputmode="numeric" />
        </Field>
        <Field label="Limite de armazenamento (MB)" id="ws-mb" error={errors.maxStorageMB ?? ''} hint="Em branco = sem limite.">
          <input class="input" id="ws-mb" bind:value={maxStorageMB} inputmode="numeric" />
        </Field>
      </div>
      <p class="muted text-sm">Primeiro administrador do espaço:</p>
      <Field label="Nome" id="ws-admin-name" required error={errors.adminName ?? ''}>
        <input class="input" id="ws-admin-name" bind:value={adminName} autocomplete="off" />
      </Field>
      <div class="form-grid">
        <Field label="E-mail" id="ws-admin-email" required error={errors.adminEmail ?? ''}>
          <input class="input" id="ws-admin-email" type="email" bind:value={adminEmail} autocomplete="off" />
        </Field>
        <Field label="Senha inicial" id="ws-admin-pass" required error={errors.adminPassword ?? ''}>
          <input class="input" id="ws-admin-pass" type="password" bind:value={adminPassword} autocomplete="new-password" />
        </Field>
      </div>
      {#if apiError}<p class="text-sm text-error-500" role="alert">{apiError}</p>{/if}
    </div>
    <footer class="form-footer">
      <a href="/admin/workspaces?cancelled=1" class="btn btn-sm variant-ringed">Cancelar</a>
      <button class="btn btn-sm variant-filled-primary min-w-24" disabled={busy}>{busy ? 'Criando…' : 'Criar espaço'}</button>
    </footer>
  </form>
</div>
