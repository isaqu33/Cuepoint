/**
 * Worker de mídia do Cuepoint: processo separado do web, escalável à parte.
 * Consome a fila de transcrição; o resultado só é dado como concluído depois de gravado.
 */
import { transcriptionConfig } from '../src/server/transcription/config';
import { transcriptionJobSchema } from '../src/server/transcription/contracts';
import { getTranscriptionQueue } from '../src/server/transcription/queue';
import { processTranscription } from '../src/server/transcription/process';
import { state } from '../src/server/transcription/state';
import { emit } from '../src/server/events/publish';
import { prisma } from '../src/server/utils/db';
import Queue from 'bull';
import Redis from 'ioredis';
import { runBatchJob } from '../src/server/batch/jobs';
import { log } from '../src/server/observability/log';
import { runAlertCheck } from '../src/server/observability/alerts-runner';
import { relayUnpublished } from '../src/server/events/relay';
import { METRICS_KEY } from '../src/server/events/subscribers/metrics';

const cfg = transcriptionConfig();
const queue = getTranscriptionQueue();

const metricsRedis = new Redis(cfg.redis);

queue.process(cfg.concurrency, async (job) => {
  const payload = transcriptionJobSchema.parse(job.data);
  const startedAt = Date.now();
  // Espera = do enfileiramento ao início desta tentativa (métrica de fila).
  const waitMs = Math.max(0, startedAt - job.timestamp);
  const corr = { jobId: String(job.id), lessonId: payload.lessonId, requestId: payload.requestId, traceparent: payload.traceparent };
  log('info', 'job iniciado', { ...corr, attempt: job.attemptsMade + 1, attempts: cfg.attempts });
  await processTranscription(payload, { attempt: job.attemptsMade + 1 });
  const runMs = Date.now() - startedAt;
  await metricsRedis
    .multi()
    .hincrby(METRICS_KEY, 'queue.jobs.done', 1)
    .hincrby(METRICS_KEY, 'queue.waitMs.total', waitMs)
    .hincrby(METRICS_KEY, 'queue.runMs.total', runMs)
    .hset(METRICS_KEY, 'queue.runMs.max', String(Math.max(runMs, 0)))
    .exec()
    .catch(() => undefined);
  log('info', 'job concluído', { ...corr, waitMs, runMs });
});

// Falha terminal (retries esgotados): estado persistido + ação de reprocessamento na UI.
queue.on('failed', async (job, err) => {
  const attempts = job.opts.attempts ?? 1;
  log('error', 'job falhou', { jobId: String(job.id), lessonId: job.data.lessonId, requestId: job.data.requestId, traceparent: job.data.traceparent, attempt: job.attemptsMade, attempts, error: err.message.slice(0, 300) });
  const final = job.attemptsMade >= attempts;
  if (final) await state.failed(job.data.lessonId, err.message).catch(() => undefined);
  await emit('media.transcription.failed', job.data.lessonId, {
    lessonId: job.data.lessonId,
    userId: job.data.userId,
    error: err.message.slice(0, 300),
    attempt: job.attemptsMade,
    final,
  }).catch(() => undefined);
});

// Job travado (worker morreu no meio): Bull o recoloca na fila; mantemos o estado coerente.
queue.on('stalled', (job) => console.warn(`[worker] job ${job.id} travado; será reenfileirado`));

// Batch: reconciliação periódica e rotina noturna (padrão batch). Fila própria, separada da transcrição:
// um lote lento nunca atrasa um pedido do usuário. Repetições do Bull são únicas por chave, mesmo com N workers.
const TZ = process.env.BATCH_TZ ?? process.env.TZ ?? 'America/Sao_Paulo';
const RECONCILE_CRON = process.env.RECONCILE_CRON ?? '*/10 * * * *';
const NIGHTLY_CRON = process.env.NIGHTLY_CRON ?? '0 2 * * *';
const maintenance = new Queue('maintenanceQueue', {
  redis: cfg.redis,
  defaultJobOptions: { removeOnComplete: true, removeOnFail: 50 },
});
maintenance.process('reconcile', 1, async () => {
  await runBatchJob('reconcile', 'schedule');
  await runAlertCheck().catch((err) => log('error', 'verificação de alertas falhou', { error: (err as Error).message }));
});
maintenance.process('nightly', 1, async () => void (await runBatchJob('nightly', 'schedule')));
// Relay do outbox: a cada minuto; só registra execução quando havia algo a republicar (evita ruído no BatchRun).
maintenance.process('relay', 1, async () => {
  const r = await relayUnpublished();
  if (r.found > 0) console.log('[relay] republicados', JSON.stringify(r));
});
void maintenance.add('relay', {}, { repeat: { cron: process.env.RELAY_CRON ?? '* * * * *', tz: TZ }, jobId: 'relay-cron' });
void maintenance.add('reconcile', {}, { repeat: { cron: RECONCILE_CRON, tz: TZ }, jobId: 'reconcile-cron' });
void maintenance.add('nightly', {}, { repeat: { cron: NIGHTLY_CRON, tz: TZ }, jobId: 'nightly-cron' });
console.log(`[worker] batch agendado: reconciliação "${RECONCILE_CRON}", rotina "${NIGHTLY_CRON}" (${TZ})`);

async function shutdown(signal: string) {
  console.log(`[worker] ${signal} recebido; aguardando job atual…`);
  await Promise.all([queue.close(), maintenance.close()]); // esperam o job em andamento terminar
  metricsRedis.disconnect();
  await prisma.$disconnect();
  process.exit(0);
}
process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

console.log(`[worker] pronto — concorrência ${cfg.concurrency}`);
