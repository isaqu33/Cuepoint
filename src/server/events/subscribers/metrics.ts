import Redis from 'ioredis';
import { transcriptionConfig } from '../../transcription/config';
import type { EventBus } from '../bus';

export const METRICS_KEY = 'cuepoint:metrics';

/** Contadores simples por tipo de evento e tempo total de processamento. */
export async function startMetricsSubscriber(bus: EventBus) {
  const redis = new Redis(transcriptionConfig().redis);
  const unsubscribe = await bus.subscribe('metrics', async (event) => {
    if (event.type === 'media.transcription.progress' || event.type === 'media.transcription.cue') return; // ruído
    await redis.hincrby(METRICS_KEY, event.type, 1);
    if (event.type === 'media.transcription.completed') {
      await redis.hincrby(METRICS_KEY, 'transcription.durationMs.total', event.data.durationMs);
    }
  });
  return async () => {
    await unsubscribe();
    redis.disconnect();
  };
}

export async function readMetrics(redis: Redis) {
  const raw = await redis.hgetall(METRICS_KEY);
  const n = (k: string) => Number(raw[k] ?? 0);
  const completed = n('media.transcription.completed');
  return {
    queued: n('media.transcription.queued'),
    started: n('media.transcription.started'),
    completed,
    failed: n('media.transcription.failed'),
    avgDurationMs: completed ? Math.round(n('transcription.durationMs.total') / completed) : 0,
    queue: {
      jobsDone: n('queue.jobs.done'),
      avgWaitMs: n('queue.jobs.done') ? Math.round(n('queue.waitMs.total') / n('queue.jobs.done')) : 0,
      avgRunMs: n('queue.jobs.done') ? Math.round(n('queue.runMs.total') / n('queue.jobs.done')) : 0,
    },
  };
}
