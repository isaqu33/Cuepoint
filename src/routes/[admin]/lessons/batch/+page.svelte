<script lang="ts">
  import { goto, invalidateAll } from '$app/navigation';
  import Field from '$lib/components/ui/Field.svelte';
  import ImagePicker from '$lib/components/ui/ImagePicker.svelte';
  import { runPool, titleFromFilename, uniqueTitles } from '$lib/utils/batch-upload';
  import { uploadDirect } from '$lib/utils/direct-upload';

  type Status = 'wait' | 'upload' | 'create' | 'queued' | 'done' | 'error';
  type Item = { file: File; title: string; status: Status; pct: number; message: string };

  const MAX_FILES = 20;
  const CONCURRENCY = 2;
  const label: Record<Status, string> = {
    wait: 'Aguardando',
    upload: 'Enviando',
    create: 'Salvando',
    queued: 'Na fila de transcrição',
    done: 'Concluído',
    error: 'Falhou',
  };

  let items: Item[] = [];
  let cover: File | null = null;
  let coverPreview = '';
  let description = 'Enviado em lote';
  let transcribe = true;
  let running = false;
  let finished = false;
  let errors: Record<string, string> = {};
  let over = false;

  $: counts = {
    done: items.filter((i) => i.status === 'done' || i.status === 'queued').length,
    error: items.filter((i) => i.status === 'error').length,
  };

  function addFiles(list: FileList | File[]) {
    const audio = Array.from(list).filter((f) => f.type.startsWith('audio/') || f.type.startsWith('video/'));
    const room = MAX_FILES - items.length;
    const titles = uniqueTitles([...items.map((i) => i.title), ...audio.slice(0, room).map((f) => titleFromFilename(f.name))]);
    const added = audio.slice(0, room).map((file, k) => ({
      file, title: titles[items.length + k], status: 'wait' as Status, pct: 0, message: '',
    }));
    items = [...items, ...added];
    errors = { ...errors, files: audio.length < list.length ? 'Alguns arquivos não são de áudio ou vídeo e foram ignorados.' : audio.length > room ? `O limite é ${MAX_FILES} arquivos por lote.` : '' };
  }
  const onPick = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.files) addFiles(input.files);
    input.value = '';
  };
  function onDrop(e: DragEvent) {
    over = false;
    if (e.dataTransfer?.files) addFiles(e.dataTransfer.files);
  }
  function onCover(e: Event) {
    const f = (e.target as HTMLInputElement).files?.[0];
    if (!f) return;
    cover = f;
    const r = new FileReader();
    r.onload = () => (coverPreview = String(r.result));
    r.readAsDataURL(f);
  }
  const remove = (i: number) => (items = items.filter((_, k) => k !== i));
  const patch = (i: number, p: Partial<Item>) => (items[i] = { ...items[i], ...p });

  /** Um arquivo do lote: envia (direto ao storage), cria o registro e, se pedido, enfileira a transcrição. */
  async function processOne(i: number) {
    const it = items[i];
    try {
      patch(i, { status: 'upload', pct: 0, message: '' });
      // Cada arquivo leva a própria cópia da capa: excluir um arquivo não pode apagar a imagem dos outros.
      const imageKey = await uploadDirect('image', cover as File);
      const audioKey = await uploadDirect('audio', it.file, (p) => patch(i, { pct: p }));
      patch(i, { status: 'create', pct: 100 });
      const res = await fetch('/api/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: it.title, description, imageKey, audioKey, imageName: (cover as File).name, audioName: it.file.name }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Não foi possível salvar o arquivo');
      if (transcribe) {
        const t = await fetch(`/api/lessons/${body.id}/transcription`, { method: 'POST', headers: { 'Idempotency-Key': `lote-${body.id}` } });
        if (!t.ok) throw new Error('Salvo, mas não foi possível enfileirar a transcrição');
        patch(i, { status: 'queued' });
      } else {
        patch(i, { status: 'done' });
      }
    } catch (err) {
      patch(i, { status: 'error', message: (err as Error).message });
    }
  }

  async function start(onlyFailed = false) {
    errors = {};
    if (!items.length) errors.files = 'Escolha ao menos um áudio.';
    if (!cover) errors.cover = 'A imagem de capa é obrigatória.';
    if (!description.trim()) errors.description = 'A descrição é obrigatória.';
    if (Object.keys(errors).length) return;
    running = true;
    finished = false;
    const todo = items.map((it, i) => ({ it, i })).filter(({ it }) => (onlyFailed ? it.status === 'error' : it.status === 'wait'));
    await runPool(todo, CONCURRENCY, ({ i }) => processOne(i));
    running = false;
    finished = true;
    await invalidateAll();
  }

  /** Com arquivos criados, sair sem `cancelled` faz o painel atualizar a lista e avisar; sem nada criado, só fecha. */
  function close() {
    goto(counts.done > 0 ? '/admin/lessons' : '/admin/lessons?cancelled=1');
  }
</script>

<div class="form-page">
  <div class="form-title"><h1 class="page-title">Envio em lote</h1></div>
  <div class="form-body">
    <p class="muted text-sm">
      Envie vários áudios ou vídeos de uma vez. Os arquivos vão direto ao armazenamento ({CONCURRENCY} por vez) e cada um vira um arquivo
      da biblioteca, com o nome do arquivo como título.
    </p>

    <Field label="Áudios ou vídeos" required error={errors.files ?? ''} hint={`Até ${MAX_FILES} arquivos por lote.`}>
      <label
        class="dropzone"
        class:over
        on:dragover|preventDefault={() => (over = true)}
        on:dragleave={() => (over = false)}
        on:drop|preventDefault={onDrop}
      >
        <span>Arraste os arquivos aqui ou clique para escolher</span>
        <input id="batch-audio" class="sr-only" type="file" accept="audio/*,video/*" multiple disabled={running} on:change={onPick} />
      </label>
    </Field>

    <div class="form-grid">
      <Field label="Imagem de capa" required error={errors.cover ?? ''} hint="Usada em todos os arquivos do lote.">
        <ImagePicker preview={coverPreview} id="batch-cover" on:change={onCover} />
      </Field>
      <div>
        <Field label="Descrição" id="batch-description" required error={errors.description ?? ''}>
          <textarea class="input" id="batch-description" rows="3" bind:value={description} disabled={running}></textarea>
        </Field>
        <label class="mt-3 flex items-center gap-2 text-sm">
          <input class="checkbox" type="checkbox" bind:checked={transcribe} disabled={running} />
          Pedir a transcrição de cada arquivo depois do envio
        </label>
      </div>
    </div>

    {#if items.length}
      <ul class="panel divide-y overflow-hidden" data-testid="lote" aria-label="Arquivos do lote">
        {#each items as it, i (it.file.name + i)}
          <li class="flex flex-wrap items-center gap-3 px-4 py-3" data-status={it.status}>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-medium">{it.title}</p>
              <p class="muted truncate text-xs">{it.file.name} · {(it.file.size / 1024 ** 2).toFixed(1)} MB</p>
              {#if it.message}<p class="text-xs text-error-500" role="alert">{it.message}</p>{/if}
            </div>
            <span class="text-sm" role="status">
              {label[it.status]}{#if it.status === 'upload'} {it.pct}%{/if}
            </span>
            {#if it.status === 'wait' && !running}
              <button type="button" class="btn btn-sm variant-ringed" aria-label={`Remover ${it.title}`} on:click={() => remove(i)}>Remover</button>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}

    {#if finished}
      <p class="text-sm" role="status" data-testid="resumo-lote">
        {counts.done} de {items.length} arquivo(s) enviado(s){#if counts.error}; {counts.error} com falha{/if}.
      </p>
    {/if}
  </div>

  <footer class="form-footer">
    <button type="button" class="btn btn-sm variant-ringed" on:click={close} disabled={running}>{finished ? 'Fechar' : 'Cancelar'}</button>
    {#if finished && counts.error}
      <button type="button" class="btn btn-sm variant-ringed" on:click={() => start(true)} disabled={running}>Tentar de novo os que falharam</button>
    {/if}
    {#if !finished}
      <button type="button" class="btn btn-sm variant-filled-primary min-w-24" on:click={() => start()} disabled={running || !items.length}>
        {running ? 'Enviando…' : `Enviar ${items.length || ''} arquivo${items.length === 1 ? '' : 's'}`}
      </button>
    {/if}
  </footer>
</div>

<style>
  .dropzone {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 5rem;
    cursor: pointer;
    border: 2px dashed rgb(var(--cp-border));
    border-radius: 12px;
    color: rgb(var(--cp-muted));
    font-size: 0.875rem;
    text-align: center;
    padding: 1rem;
  }
  .dropzone.over,
  .dropzone:focus-within {
    border-color: rgb(var(--color-primary-500));
    outline: 2px solid rgb(var(--color-primary-500));
    outline-offset: 2px;
  }
</style>
