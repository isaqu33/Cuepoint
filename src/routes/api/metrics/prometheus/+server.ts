import Redis from 'ioredis';
import { toPrometheus } from '../../../../server/observability/alerts';
import { collectSignals } from '../../../../server/observability/alerts-runner';
import { METRICS_KEY } from '../../../../server/events/subscribers/metrics';
import { transcriptionConfig } from '../../../../server/transcription/config';
import type { RequestHandler } from './$types';

let redis: Redis | undefined;

/** Métricas em formato Prometheus (fila, falhas, outbox, backup e contadores dos eventos). Só o operador de plataforma. */
export const GET: RequestHandler = async () => {
  redis ??= new Redis(transcriptionConfig().redis);
  const raw = await redis.hgetall(METRICS_KEY);
  const counters = Object.fromEntries(Object.entries(raw).map(([k, v]) => [k, Number(v)]));
  return new Response(toPrometheus(await collectSignals(), counters), {
    headers: { 'Content-Type': 'text/plain; version=0.0.4; charset=utf-8', 'Cache-Control': 'no-store' },
  });
};
