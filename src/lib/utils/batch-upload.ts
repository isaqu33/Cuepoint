/** Utilitários puros do envio em lote (testáveis, sem DOM). */

/** "Aula 01 - Introdução.mp3" → "Aula 01 - Introdução". */
export function titleFromFilename(name: string): string {
  return name.replace(/\.[a-z0-9]{2,5}$/i, '').replace(/[_]+/g, ' ').replace(/\s+/g, ' ').trim();
}

/** Garante títulos únicos dentro do próprio lote ("Aula", "Aula (2)", "Aula (3)"). */
export function uniqueTitles(titles: string[]): string[] {
  const seen = new Map<string, number>();
  return titles.map((t) => {
    const n = (seen.get(t) ?? 0) + 1;
    seen.set(t, n);
    return n === 1 ? t : `${t} (${n})`;
  });
}

/**
 * Processa `items` com no máximo `limit` tarefas simultâneas (batch com concorrência limitada).
 * Uma tarefa que falha não interrompe as outras: o erro é devolvido ao chamador por item.
 */
export async function runPool<T>(
  items: T[],
  limit: number,
  worker: (item: T, index: number) => Promise<void>,
): Promise<void> {
  let next = 0;
  const lanes = Array.from({ length: Math.max(1, Math.min(limit, items.length)) }, async () => {
    while (next < items.length) {
      const i = next++;
      await worker(items[i], i).catch(() => undefined);
    }
  });
  await Promise.all(lanes);
}
