<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { formatTimestamp, parseTimestamp, validateCues, type TimedCue } from '../../../server/transcription/subtitles';

  /** Trechos atuais (ms). O editor trabalha numa cópia: Cancelar não altera nada. */
  export let cues: TimedCue[];
  export let lessonId: string;

  const dispatch = createEventDispatcher<{ saved: TimedCue[]; cancel: void }>();

  type Row = { start: string; end: string; text: string; error: string };
  let rows: Row[] = cues.map((c) => ({ start: formatTimestamp(c.startMs), end: formatTimestamp(c.endMs), text: c.text, error: '' }));
  let saving = false;
  let message = '';

  const add = (i: number) => {
    const prev = rows[i];
    const end = parseTimestamp(prev.end) ?? 0;
    rows = [...rows.slice(0, i + 1), { start: formatTimestamp(end), end: formatTimestamp(end + 2000), text: '', error: '' }, ...rows.slice(i + 1)];
  };
  const remove = (i: number) => (rows = rows.filter((_, k) => k !== i));

  async function save() {
    message = '';
    let hasError = false;
    const parsed: TimedCue[] = [];
    rows = rows.map((r) => {
      const startMs = parseTimestamp(r.start);
      const endMs = parseTimestamp(r.end);
      let error = '';
      if (startMs === null || endMs === null) error = 'Tempo inválido. Use hh:mm:ss.mmm';
      else if (!r.text.trim()) error = 'O texto não pode ficar vazio';
      else if (endMs <= startMs) error = 'O fim deve ser depois do início';
      if (error) hasError = true;
      else parsed.push({ startMs: startMs as number, endMs: endMs as number, text: r.text });
      return { ...r, error };
    });
    if (hasError) return;
    const valid = validateCues(parsed);
    if (!valid.ok) {
      message = valid.message;
      return;
    }
    saving = true;
    try {
      const res = await fetch(`/api/transcriptions/${lessonId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ cues: valid.cues }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error ?? 'Não foi possível salvar');
      dispatch('saved', valid.cues);
    } catch (err) {
      message = (err as Error).message;
    } finally {
      saving = false;
    }
  }
</script>

<div data-testid="editor-trechos">
  <ol class="max-h-[56vh] space-y-3 overflow-y-auto pr-1">
    {#each rows as row, i}
      <li class="rounded-xl border p-3" style="border-color: rgb(var(--cp-border))">
        <div class="flex flex-wrap items-center gap-2">
          <label class="sr-only" for={`s-${i}`}>Início do trecho {i + 1}</label>
          <input id={`s-${i}`} class="input w-32 text-xs tabular-nums" bind:value={row.start} disabled={saving} inputmode="numeric" />
          <span aria-hidden="true">→</span>
          <label class="sr-only" for={`e-${i}`}>Fim do trecho {i + 1}</label>
          <input id={`e-${i}`} class="input w-32 text-xs tabular-nums" bind:value={row.end} disabled={saving} inputmode="numeric" />
          <span class="ml-auto flex gap-1">
            <button type="button" class="btn btn-sm variant-ringed" on:click={() => add(i)} disabled={saving} aria-label={`Adicionar trecho depois do ${i + 1}`}>+</button>
            <button type="button" class="btn btn-sm variant-ringed" on:click={() => remove(i)} disabled={saving || rows.length === 1} aria-label={`Remover trecho ${i + 1}`}>Remover</button>
          </span>
        </div>
        <label class="sr-only" for={`t-${i}`}>Texto do trecho {i + 1}</label>
        <textarea id={`t-${i}`} class="input mt-2 text-sm" rows="2" bind:value={row.text} disabled={saving}></textarea>
        {#if row.error}<p class="mt-1 text-xs text-error-500" role="alert">{row.error}</p>{/if}
      </li>
    {/each}
  </ol>
  {#if message}<p class="mt-3 text-sm text-error-500" role="alert">{message}</p>{/if}
  <div class="mt-4 flex justify-end gap-2">
    <button type="button" class="btn btn-sm variant-ringed" on:click={() => dispatch('cancel')} disabled={saving}>Cancelar</button>
    <button type="button" class="btn btn-sm variant-filled-primary" on:click={save} disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button>
  </div>
</div>
