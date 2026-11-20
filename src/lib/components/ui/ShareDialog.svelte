<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import ModalShell from './ModalShell.svelte';

  /** Compartilhar um arquivo por link temporário (sem login). Só administradores. */
  export let lessonId: string;
  export let title: string;

  const dispatch = createEventDispatcher<{ close: void }>();
  type LinkRow = { id: string; createdAt: string; expiresAt: string; revokedAt: string | null; views: number; active: boolean };

  const options = [
    { hours: 1, label: '1 hora' },
    { hours: 24, label: '24 horas' },
    { hours: 72, label: '3 dias' },
    { hours: 168, label: '7 dias' },
    { hours: 720, label: '30 dias' },
  ];
  let hours = 72;
  let created: { url: string; expiresAt: string } | null = null;
  let links: LinkRow[] = [];
  let busy = false;
  let error = '';
  let copied = false;

  const fmt = (d: string) => new Date(d).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' });

  async function load() {
    const res = await fetch(`/api/lessons/${lessonId}/share`);
    if (res.ok) links = (await res.json()).links;
  }
  async function create() {
    busy = true;
    error = '';
    copied = false;
    const res = await fetch(`/api/lessons/${lessonId}/share`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresInHours: hours }),
    });
    const body = await res.json().catch(() => ({}));
    busy = false;
    if (!res.ok) {
      error = body.error ?? 'Não foi possível criar o link';
      return;
    }
    created = { url: body.url, expiresAt: body.expiresAt };
    await load();
  }
  async function revoke(id: string) {
    const res = await fetch(`/api/share/${id}`, { method: 'DELETE' });
    if (res.ok) await load();
  }
  async function copy() {
    if (!created) return;
    try {
      await navigator.clipboard.writeText(created.url);
      copied = true;
    } catch {
      (document.getElementById('share-url') as HTMLInputElement | null)?.select();
    }
  }
  onMount(load);
</script>

<div class="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]" role="presentation">
  <ModalShell title="Compartilhar" description={`Quem tiver o link vê "${title}" e a transcrição, sem precisar de conta.`} onClose={() => dispatch('close')}>
    <div>
      <label class="field-label" for="share-ttl">Válido por</label>
      <div class="mt-1.5 flex gap-2">
        <select id="share-ttl" class="select" bind:value={hours} disabled={busy}>
          {#each options as o}<option value={o.hours}>{o.label}</option>{/each}
        </select>
        <button type="button" class="btn variant-filled-primary shrink-0" on:click={create} disabled={busy}>{busy ? 'Gerando…' : 'Gerar link'}</button>
      </div>
      {#if error}<p class="mt-2 text-sm text-error-500" role="alert">{error}</p>{/if}
    </div>

    {#if created}
      <div data-testid="link-gerado">
        <label class="field-label" for="share-url">Link (aparece só agora)</label>
        <div class="mt-1.5 flex gap-2">
          <input id="share-url" class="input" readonly value={created.url} on:focus={(e) => e.currentTarget.select()} />
          <button type="button" class="btn variant-ringed shrink-0" on:click={copy}>{copied ? 'Copiado' : 'Copiar'}</button>
        </div>
        <p class="muted mt-1.5 text-xs">Válido até {fmt(created.expiresAt)}.</p>
      </div>
    {/if}

    {#if links.length}
      <div>
        <p class="field-label">Links deste arquivo</p>
        <ul class="mt-1.5 divide-y" style="border-color: rgb(var(--cp-border))" data-testid="links">
          {#each links as l (l.id)}
            <li class="flex items-center justify-between gap-3 py-2 text-sm" data-active={l.active}>
              <span>
                <span class="pill {l.active ? 'pill-ready' : 'pill-idle'}">{l.revokedAt ? 'Revogado' : l.active ? 'Ativo' : 'Expirado'}</span>
                <span class="muted ml-2 text-xs">até {fmt(l.expiresAt)} · {l.views} visita(s)</span>
              </span>
              {#if l.active}<button type="button" class="btn btn-sm variant-ringed" on:click={() => revoke(l.id)}>Revogar</button>{/if}
            </li>
          {/each}
        </ul>
      </div>
    {/if}

    <svelte:fragment slot="footer"><button type="button" class="btn variant-ringed" on:click={() => dispatch('close')}>Fechar</button></svelte:fragment>
  </ModalShell>
</div>
