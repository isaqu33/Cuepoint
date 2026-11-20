/**
 * Alertas com AÇÃO: cada regra diz o que está errado e o que fazer. Avaliação pura (testável); a coleta dos
 * sinais e o envio ficam em `alerts-runner.ts`.
 */
export interface Signals {
  queue: { waiting: number; active: number; failed: number; oldestWaitingAgeMs: number };
  failedFiles: number;
  unpublishedEvents: number;
  backup: { checked: boolean; ok?: boolean; reason?: string; ageHours?: number };
}

export interface Alert {
  id: string;
  severity: 'warning' | 'critical';
  summary: string;
  /** O que a pessoa de plantão deve fazer. */
  action: string;
}

export interface Thresholds {
  queueAgeMs: number;
  failedFiles: number;
}
export const DEFAULT_THRESHOLDS: Thresholds = { queueAgeMs: 10 * 60_000, failedFiles: 3 };

export function evaluateAlerts(s: Signals, t: Thresholds = DEFAULT_THRESHOLDS): Alert[] {
  const alerts: Alert[] = [];
  const minutes = Math.round(s.queue.oldestWaitingAgeMs / 60_000);

  if (s.queue.oldestWaitingAgeMs > t.queueAgeMs && s.queue.active === 0) {
    alerts.push({
      id: 'queue-stalled', severity: 'critical',
      summary: `Fila parada: há trabalho esperando há ${minutes} min e nenhum worker processando.`,
      action: 'Verifique o worker (`docker compose ps worker` e `logs worker`) e reinicie-o. A reconciliação reenfileira o que se perdeu.',
    });
  } else if (s.queue.oldestWaitingAgeMs > t.queueAgeMs) {
    alerts.push({
      id: 'queue-backlog', severity: 'warning',
      summary: `Fila lenta: o trabalho mais antigo espera há ${minutes} min.`,
      action: 'Aumente os workers (`docker compose up -d --scale worker=N`). Veja o ponto de saturação em docs/capacity-report.md.',
    });
  }
  if (s.failedFiles >= t.failedFiles) {
    alerts.push({
      id: 'files-failed', severity: 'warning',
      summary: `${s.failedFiles} arquivo(s) com transcrição falha.`,
      action: 'Abra Processamento, leia a mensagem de erro e use "Reprocessar em lote" (POST /api/batch/retry-failed).',
    });
  }
  if (s.unpublishedEvents > 0) {
    alerts.push({
      id: 'outbox-lag', severity: 'warning',
      summary: `${s.unpublishedEvents} evento(s) gravado(s) e ainda não publicado(s) no tópico.`,
      action: 'Confira o Redis. O relay republica sozinho a cada minuto; se persistir, rode POST /api/batch/run?job=relay.',
    });
  }
  if (s.backup.checked && !s.backup.ok) {
    alerts.push({
      id: 'backup-stale', severity: 'critical',
      summary: `Backup do banco não está em dia (${s.backup.reason ?? 'desconhecido'}).`,
      action: 'Rode scripts/backup.sh agora, confira o serviço `backup` e valide com scripts/restore-check.sh.',
    });
  }
  return alerts;
}

/** Métricas no formato de texto do Prometheus (https://prometheus.io/docs/instrumenting/exposition_formats/). */
export function toPrometheus(s: Signals, counters: Record<string, number> = {}): string {
  const lines: string[] = [];
  const gauge = (name: string, help: string, value: number) => lines.push(`# HELP ${name} ${help}`, `# TYPE ${name} gauge`, `${name} ${value}`);
  gauge('cuepoint_queue_waiting', 'Jobs de transcrição esperando', s.queue.waiting);
  gauge('cuepoint_queue_active', 'Jobs de transcrição em processamento', s.queue.active);
  gauge('cuepoint_queue_failed', 'Jobs de transcrição falhos retidos na fila', s.queue.failed);
  gauge('cuepoint_queue_oldest_waiting_seconds', 'Idade do job mais antigo esperando', Math.round(s.queue.oldestWaitingAgeMs / 1000));
  gauge('cuepoint_files_failed', 'Arquivos com transcrição falha', s.failedFiles);
  gauge('cuepoint_events_unpublished', 'Eventos duráveis ainda não publicados', s.unpublishedEvents);
  gauge('cuepoint_backup_ok', 'Backup recente e válido (1) ou não (0)', s.backup.checked && s.backup.ok ? 1 : 0);
  for (const [k, v] of Object.entries(counters)) {
    const name = `cuepoint_${k.replace(/[^a-zA-Z0-9_]/g, '_')}_total`;
    lines.push(`# TYPE ${name} counter`, `${name} ${v}`);
  }
  return `${lines.join('\n')}\n`;
}
