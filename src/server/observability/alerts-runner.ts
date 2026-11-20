import Redis from 'ioredis';
import { verifyBackup } from '../batch/jobs';
import { queueStats } from '../transcription/queue-stats';
import { transcriptionConfig } from '../transcription/config';
import { prisma } from '../utils/db';
import { evaluateAlerts, type Alert, type Signals } from './alerts';
import { log } from './log';

/** Lê os sinais do sistema (fila, banco, backup). Sem contexto de espaço: visão da plataforma. */
export async function collectSignals(now = new Date()): Promise<Signals> {
  const [queue, failedFiles, unpublished, backup] = await Promise.all([
    queueStats(now.getTime()),
    prisma.mediaFile.count({ where: { transcriptionStatus: 'FAILED' } }),
    prisma.eventLog.count({ where: { publishedAt: null, createdAt: { lt: new Date(now.getTime() - 5 * 60_000) } } }),
    verifyBackup(now),
  ]);
  return {
    queue,
    failedFiles,
    unpublishedEvents: unpublished,
    backup: backup.checked
      ? { checked: true, ok: 'ok' in backup ? backup.ok : false, reason: 'reason' in backup ? String(backup.reason) : undefined, ageHours: 'ageHours' in backup ? backup.ageHours : undefined }
      : { checked: false },
  };
}

let redis: Redis | undefined;

/**
 * Avalia e notifica: cada alerta vira um log `warn`/`error` com a ação e, se `ALERT_WEBHOOK_URL` existir, um POST
 * JSON (compatível com webhook de Slack/Teams via `text`). Um mesmo alerta só é reenviado após 1 hora.
 */
export async function runAlertCheck(): Promise<Alert[]> {
  const alerts = evaluateAlerts(await collectSignals());
  const hook = process.env.ALERT_WEBHOOK_URL;
  redis ??= new Redis(transcriptionConfig().redis);
  for (const a of alerts) {
    log(a.severity === 'critical' ? 'error' : 'warn', 'alerta', { alertId: a.id, severity: a.severity, summary: a.summary, action: a.action });
    if (!hook) continue;
    const first = await redis.set(`cuepoint:alert:${a.id}`, '1', 'EX', 3600, 'NX').catch(() => 'OK');
    if (first !== 'OK') continue;
    await fetch(hook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: `${a.severity === 'critical' ? '🔴' : '🟠'} Cuepoint: ${a.summary}\nAção: ${a.action}`, alert: a }),
    }).catch((err) => log('warn', 'falha ao enviar alerta', { error: (err as Error).message }));
  }
  return alerts;
}
