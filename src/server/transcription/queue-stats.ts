import { getTranscriptionQueue } from './queue';

/** Estado atual da fila: contagens e idade do job mais antigo ainda esperando (sinal de saturação). */
export async function queueStats(now = Date.now()) {
  const q = getTranscriptionQueue();
  const [counts, waiting] = await Promise.all([q.getJobCounts(), q.getWaiting(0, 0)]);
  // `getWaiting` vem do mais novo ao mais antigo na ordem de consumo FIFO; pegamos o mais antigo da lista completa.
  const all = counts.waiting > 1 ? await q.getWaiting(0, Math.min(counts.waiting, 200) - 1) : waiting;
  const oldest = all.reduce<number | null>((min, j) => (min === null || j.timestamp < min ? j.timestamp : min), null);
  return {
    waiting: counts.waiting,
    active: counts.active,
    delayed: counts.delayed,
    failed: counts.failed,
    oldestWaitingAgeMs: oldest === null ? 0 : Math.max(0, now - oldest),
  };
}
