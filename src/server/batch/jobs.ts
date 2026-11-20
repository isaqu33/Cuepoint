import { prisma } from '../utils/db';
import { getTranscriptionQueue } from '../transcription/queue';
import { requestTranscription } from '../transcription/request';
import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { extractFilenameFromUrl } from '../../lib/utils/url-formatter';
import { ObjectStorageAdapter } from '../../utils/object-storage';
import { deleteLessonCompletely } from '../services/lesson/delete-complete';
import { relayUnpublished } from '../events/relay';
import { DAY_MS, cutoff, evaluateBackups, lessonIdFromJobId, selectExpired, selectOrphanObjects, selectOrphans } from './plan';

const num = (v: string | undefined, d: number) => (Number.isFinite(Number(v)) && Number(v) > 0 ? Number(v) : d);
export const batchConfig = () => ({
  /** Máximo de itens por execução: o lote nunca é ilimitado. */
  limit: num(process.env.BATCH_LIMIT, 100),
  graceMs: num(process.env.RECONCILE_GRACE_MINUTES, 10) * 60_000,
  idempotencyTtlMs: num(process.env.IDEMPOTENCY_TTL_HOURS, 24) * 3_600_000,
  eventRetentionDays: num(process.env.EVENT_RETENTION_DAYS, 90),
  runRetentionDays: num(process.env.BATCH_RUN_RETENTION_DAYS, 180),
  /** Retenção de mídia é OPT-IN: 0 (padrão) nunca apaga arquivos nem transcrições. */
  transcriptionRetentionDays: Number(process.env.TRANSCRIPTION_RETENTION_DAYS ?? 0),
  mediaRetentionDays: Number(process.env.MEDIA_RETENTION_DAYS ?? 0),
  retentionDryRun: process.env.RETENTION_DRY_RUN?.toLowerCase() === 'true',
  orphanGraceMs: num(process.env.ORPHAN_GRACE_HOURS, 24) * 3_600_000,
  backupDir: process.env.BACKUP_DIR ?? '',
  backupMaxAgeMs: num(process.env.BACKUP_MAX_AGE_HOURS, 26) * 3_600_000,
});

/** Ids de arquivo que têm job vivo (esperando, ativo ou adiado) na fila. */
async function liveLessonIds(): Promise<Set<string>> {
  const jobs = await getTranscriptionQueue().getJobs(['waiting', 'active', 'delayed', 'paused']);
  const ids = new Set<string>();
  for (const j of jobs) {
    const id = j && lessonIdFromJobId(j.id);
    if (id) ids.add(id);
  }
  return ids;
}

/**
 * Reconciliação: o PostgreSQL é a fonte da verdade e o Redis pode perder jobs (reinício sem persistência,
 * flush, falha entre gravar o estado e enfileirar). Arquivos "em andamento" sem job vivo são reenfileirados.
 * É seguro repetir: o job é idempotente por arquivo e o resultado é gravado com upsert.
 */
export async function reconcileStuckJobs(now = new Date()) {
  const cfg = batchConfig();
  const candidates = await prisma.mediaFile.findMany({
    where: { transcriptionStatus: { in: ['QUEUED', 'PROCESSING'] } },
    select: { id: true, updatedAt: true },
    take: cfg.limit * 5,
  });
  const orphans = selectOrphans(candidates, await liveLessonIds(), now, cfg.graceMs, cfg.limit);

  let requeued = 0;
  let failed = 0;
  for (const id of orphans) {
    const owner = await prisma.eventLog.findFirst({
      where: { aggregateId: id, type: 'media.transcription.queued' },
      orderBy: { occurredAt: 'desc' },
    });
    const userId = (owner?.data as { userId?: string } | null)?.userId ?? 'system';
    const res = await requestTranscription(id, userId);
    if (res.ok) requeued++;
    else failed++;
  }
  return { examined: candidates.length, orphans: orphans.length, requeued, failed };
}

/** Reprocessa em lote os arquivos que falharam (com limite). `requestTranscription` já é idempotente. */
export async function retryFailedBatch(userId: string, limit = batchConfig().limit) {
  const failed = await prisma.mediaFile.findMany({
    where: { transcriptionStatus: 'FAILED' },
    orderBy: { updatedAt: 'asc' },
    take: limit,
    select: { id: true },
  });
  let enqueued = 0;
  let skipped = 0;
  for (const { id } of failed) {
    const res = await requestTranscription(id, userId);
    if (res.ok && res.enqueued) enqueued++;
    else skipped++;
  }
  const remaining = await prisma.mediaFile.count({ where: { transcriptionStatus: 'FAILED' } });
  return { selected: failed.length, enqueued, skipped, remaining };
}

/** Retenção: remove só dados operacionais antigos (chaves de idempotência, eventos, log de execuções). */
export async function applyRetention(now = new Date()) {
  const cfg = batchConfig();
  const [keys, events, runs] = await Promise.all([
    prisma.idempotencyKey.deleteMany({ where: { createdAt: { lt: cutoff(now, cfg.idempotencyTtlMs) } } }),
    prisma.eventLog.deleteMany({ where: { occurredAt: { lt: cutoff(now, cfg.eventRetentionDays * DAY_MS) } } }),
    prisma.batchRun.deleteMany({ where: { startedAt: { lt: cutoff(now, cfg.runRetentionDays * DAY_MS) } } }),
  ]);
  // Jobs falhos antigos retidos no Redis (o motivo continua no PostgreSQL, em Lesson.transcriptionError).
  const oldFailedJobs = (await getTranscriptionQueue().clean(7 * DAY_MS, 'failed').catch(() => [])).length;
  return { idempotencyKeys: keys.count, events: events.count, batchRuns: runs.count, oldFailedJobs };
}

/** Objetos de envio direto que ninguém referencia (a pessoa desistiu depois do PUT) e já passaram da tolerância. */
export async function cleanOrphanObjects(now = new Date()) {
  const cfg = batchConfig();
  const storage = new ObjectStorageAdapter('lessons');
  let objects: { name: string; lastModified: Date }[];
  try {
    objects = await storage.list();
  } catch (err) {
    return { scanned: 0, deleted: 0, error: (err as Error).message.slice(0, 200) };
  }
  const [lessons, files, series, courses] = await Promise.all([
    prisma.mediaFile.findMany({ select: { photoLeson: true, audiofile: true } }),
    prisma.file.findMany({ select: { path: true } }),
    prisma.subcollection.findMany({ select: { photoLeson: true } }),
    prisma.collection.findMany({ select: { photoLeson: true } }),
  ]);
  const referenced = new Set<string>();
  const add = (u: string | null | undefined) => u && referenced.add(extractFilenameFromUrl(u));
  for (const l of lessons) (add(l.photoLeson), add(l.audiofile));
  for (const f of files) add(f.path);
  for (const s of series) add(s.photoLeson);
  for (const c of courses) add(c.photoLeson);

  const orphans = selectOrphanObjects(objects, referenced, now, cfg.orphanGraceMs, cfg.limit);
  for (const name of orphans) await storage.deleteBlobIfExists(name).catch(() => undefined);
  return { scanned: objects.length, deleted: orphans.length };
}

/**
 * Retenção de mídia (OPT-IN, desligada por padrão): remove transcrições e/ou arquivos sem atividade há N dias.
 * `RETENTION_DRY_RUN=true` só conta, sem apagar. Sempre com limite de lote e fato `media.file.deleted` por exclusão.
 */
export async function applyMediaRetention(now = new Date()) {
  const cfg = batchConfig();
  const out = { transcriptions: 0, files: 0, dryRun: cfg.retentionDryRun };

  if (cfg.transcriptionRetentionDays > 0) {
    const rows = await prisma.transcription.findMany({
      where: { lessonId: { not: null } },
      select: { id: true, lessonId: true, updatedAt: true },
      take: cfg.limit * 5,
    });
    const ids = new Set(selectExpired(rows.map((r) => ({ id: r.id, updatedAt: r.updatedAt })), now, cfg.transcriptionRetentionDays, cfg.limit));
    for (const row of rows.filter((r) => ids.has(r.id))) {
      out.transcriptions++;
      if (cfg.retentionDryRun) continue;
      await prisma.$transaction([
        prisma.transcription.delete({ where: { id: row.id } }),
        prisma.mediaFile.update({ where: { id: row.lessonId as string }, data: { transcriptionStatus: 'IDLE', transcriptionProgress: 0, transcriptionError: null } }),
      ]);
    }
  }

  if (cfg.mediaRetentionDays > 0) {
    const rows = await prisma.mediaFile.findMany({ select: { id: true, updatedAt: true }, take: cfg.limit * 5 });
    for (const id of selectExpired(rows, now, cfg.mediaRetentionDays, cfg.limit)) {
      out.files++;
      if (!cfg.retentionDryRun) await deleteLessonCompletely(id, { reason: 'retention' }).catch(() => undefined);
    }
  }
  return out;
}

/** O backup mais recente em `BACKUP_DIR` existe, tem conteúdo e é novo o bastante? (sem `BACKUP_DIR`, não verificado) */
export async function verifyBackup(now = new Date()) {
  const cfg = batchConfig();
  if (!cfg.backupDir) return { checked: false as const, reason: 'BACKUP_DIR não configurado' };
  try {
    const names = await readdir(cfg.backupDir);
    const files = await Promise.all(
      names.map(async (name) => {
        const st = await stat(path.join(cfg.backupDir, name));
        return { name, mtime: st.mtime, size: st.size };
      }),
    );
    return { checked: true as const, ...evaluateBackups(files, now, cfg.backupMaxAgeMs) };
  } catch (err) {
    return { checked: true as const, ok: false as const, reason: `erro ao ler ${cfg.backupDir}: ${(err as Error).message}`.slice(0, 200) };
  }
}

/** Relatório de uso (instantâneo): vira o `stats` da execução noturna. */
export async function usageReport() {
  const [lessons, byStatus, transcriptions, users, events24h] = await Promise.all([
    prisma.mediaFile.count(),
    prisma.mediaFile.groupBy({ by: ['transcriptionStatus'], _count: true }),
    prisma.transcription.count(),
    prisma.user.count(),
    prisma.eventLog.count({ where: { occurredAt: { gte: cutoff(new Date(), DAY_MS) } } }),
  ]);
  return {
    files: lessons,
    transcriptions,
    members: users,
    events24h,
    byStatus: Object.fromEntries(byStatus.map((s) => [s.transcriptionStatus, s._count])),
  };
}

export type BatchJobName = 'reconcile' | 'nightly' | 'relay';

/** Executa um job em lote registrando início, fim, resultado e erro em `BatchRun`. */
export async function runBatchJob(job: BatchJobName, trigger: 'schedule' | 'manual') {
  const run = await prisma.batchRun.create({
    data: { job, trigger, status: 'RUNNING', startedAt: new Date() },
  });
  try {
    const stats =
      job === 'reconcile'
        ? { reconcile: await reconcileStuckJobs() }
        : job === 'relay'
          ? { relay: await relayUnpublished() }
          : {
              reconcile: await reconcileStuckJobs(),
              relay: await relayUnpublished(),
              retention: await applyRetention(),
              mediaRetention: await applyMediaRetention(),
              orphanObjects: await cleanOrphanObjects(),
              backup: await verifyBackup(),
              usage: await usageReport(),
            };
    await prisma.batchRun.update({
      where: { id: run.id },
      data: { status: 'OK', finishedAt: new Date(), stats },
    });
    console.log(`[batch] ${job} ok`, JSON.stringify(stats));
    return { id: run.id, status: 'OK' as const, stats };
  } catch (err) {
    const message = (err as Error).message.slice(0, 500);
    await prisma.batchRun.update({
      where: { id: run.id },
      data: { status: 'FAILED', finishedAt: new Date(), error: message },
    });
    console.error(`[batch] ${job} falhou: ${message}`);
    return { id: run.id, status: 'FAILED' as const, error: message };
  }
}
