/** Regras puras do lote (testáveis sem banco nem Redis). */

export type Candidate = { id: string; updatedAt: Date };

/**
 * Arquivos em andamento (QUEUED/PROCESSING) que NÃO têm job vivo na fila e já passaram do período
 * de tolerância. Sem a tolerância, brigaríamos com um pedido recém-enfileirado.
 */
export function selectOrphans(
  candidates: Candidate[],
  liveLessonIds: ReadonlySet<string>,
  now: Date,
  graceMs: number,
  limit: number,
): string[] {
  return candidates
    .filter((c) => now.getTime() - c.updatedAt.getTime() >= graceMs && !liveLessonIds.has(c.id))
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
    .slice(0, limit)
    .map((c) => c.id);
}

export const cutoff = (now: Date, ms: number) => new Date(now.getTime() - ms);
export const DAY_MS = 86_400_000;

/** Job do Bull (`transcribe-<id>`) → id do arquivo. */
export const lessonIdFromJobId = (jobId: string | number): string | null => {
  const m = /^transcribe-(.+)$/.exec(String(jobId));
  return m ? m[1] : null;
};

const OWN_KEY = /^(audio|image|video)_[0-9a-f-]{36}\.[a-z0-9]{2,5}$/;

/**
 * Objetos no storage que NINGUÉM referencia (envio direto desistido). Só considera chaves geradas pelo
 * servidor (nunca mexe em arquivo legado), respeita a tolerância (um envio em andamento ainda não tem registro)
 * e o limite do lote.
 */
export function selectOrphanObjects(
  objects: { name: string; lastModified: Date }[],
  referenced: ReadonlySet<string>,
  now: Date,
  graceMs: number,
  limit: number,
): string[] {
  return objects
    .filter((o) => OWN_KEY.test(o.name) && !referenced.has(o.name) && now.getTime() - o.lastModified.getTime() >= graceMs)
    .sort((a, b) => a.lastModified.getTime() - b.lastModified.getTime())
    .slice(0, limit)
    .map((o) => o.name);
}

/** Itens sem atividade há mais de `days` dias, do mais antigo ao mais novo, limitados ao lote. `days` <= 0 desliga. */
export function selectExpired(items: Candidate[], now: Date, days: number, limit: number): string[] {
  if (!(days > 0)) return [];
  const limitDate = cutoff(now, days * DAY_MS).getTime();
  return items
    .filter((i) => i.updatedAt.getTime() < limitDate)
    .sort((a, b) => a.updatedAt.getTime() - b.updatedAt.getTime())
    .slice(0, limit)
    .map((i) => i.id);
}

export type BackupFile = { name: string; mtime: Date; size: number };
export type BackupStatus =
  | { ok: true; latest: string; ageHours: number; sizeBytes: number }
  | { ok: false; reason: 'nenhum-backup' | 'backup-antigo' | 'backup-vazio'; latest?: string; ageHours?: number };

/** O backup mais recente existe, não está vazio e é novo o bastante? */
export function evaluateBackups(files: BackupFile[], now: Date, maxAgeMs: number): BackupStatus {
  const dumps = files.filter((f) => /\.(dump|sql|sql\.gz|tar\.gz)$/i.test(f.name));
  if (!dumps.length) return { ok: false, reason: 'nenhum-backup' };
  const latest = [...dumps].sort((a, b) => b.mtime.getTime() - a.mtime.getTime())[0];
  const ageMs = now.getTime() - latest.mtime.getTime();
  const ageHours = Math.round((ageMs / 3_600_000) * 10) / 10;
  if (latest.size <= 0) return { ok: false, reason: 'backup-vazio', latest: latest.name, ageHours };
  if (ageMs > maxAgeMs) return { ok: false, reason: 'backup-antigo', latest: latest.name, ageHours };
  return { ok: true, latest: latest.name, ageHours, sizeBytes: latest.size };
}
