import { describe, expect, it } from 'vitest';
import { evaluateAlerts, toPrometheus, type Signals } from './alerts';

const healthy: Signals = {
  queue: { waiting: 0, active: 0, failed: 0, oldestWaitingAgeMs: 0 },
  failedFiles: 0,
  unpublishedEvents: 0,
  backup: { checked: true, ok: true, ageHours: 3 },
};
const with_ = (p: Partial<Signals>): Signals => ({ ...healthy, ...p });

describe('alertas', () => {
  it('tudo saudável: nenhum alerta', () => {
    expect(evaluateAlerts(healthy)).toEqual([]);
  });
  it('fila parada (espera + ninguém processando) é crítico; fila lenta (com worker ativo) é aviso', () => {
    const stalled = evaluateAlerts(with_({ queue: { waiting: 3, active: 0, failed: 0, oldestWaitingAgeMs: 15 * 60_000 } }));
    expect(stalled).toHaveLength(1);
    expect(stalled[0]).toMatchObject({ id: 'queue-stalled', severity: 'critical' });
    const slow = evaluateAlerts(with_({ queue: { waiting: 9, active: 1, failed: 0, oldestWaitingAgeMs: 15 * 60_000 } }));
    expect(slow[0]).toMatchObject({ id: 'queue-backlog', severity: 'warning' });
  });
  it('toda regra traz uma ação concreta', () => {
    const all = evaluateAlerts({
      queue: { waiting: 1, active: 0, failed: 0, oldestWaitingAgeMs: 99 * 60_000 }, failedFiles: 5, unpublishedEvents: 2,
      backup: { checked: true, ok: false, reason: 'backup-antigo' },
    });
    expect(all.map((a) => a.id).sort()).toEqual(['backup-stale', 'files-failed', 'outbox-lag', 'queue-stalled']);
    for (const a of all) expect(a.action.length).toBeGreaterThan(20);
  });
  it('backup não verificado (sem BACKUP_DIR) não gera alerta falso', () => {
    expect(evaluateAlerts(with_({ backup: { checked: false } }))).toEqual([]);
  });
  it('limites respeitam o configurado', () => {
    expect(evaluateAlerts(with_({ failedFiles: 2 }))).toEqual([]);
    expect(evaluateAlerts(with_({ failedFiles: 2 }), { queueAgeMs: 1, failedFiles: 2 })).toHaveLength(1);
  });
});

describe('formato Prometheus', () => {
  it('gera HELP/TYPE e valores; contadores ganham o sufixo _total', () => {
    const out = toPrometheus(with_({ queue: { waiting: 4, active: 1, failed: 2, oldestWaitingAgeMs: 12_000 } }), { 'media.transcription.completed': 7 });
    expect(out).toContain('# TYPE cuepoint_queue_waiting gauge\ncuepoint_queue_waiting 4');
    expect(out).toContain('cuepoint_queue_oldest_waiting_seconds 12');
    expect(out).toContain('cuepoint_media_transcription_completed_total 7');
    expect(out.endsWith('\n')).toBe(true);
  });
});
