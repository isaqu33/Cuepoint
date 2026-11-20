import { prisma } from '../utils/db';

export interface Limits {
  maxFiles: number | null;
  maxStorageBytes: number | null;
}
export interface Usage {
  files: number;
  bytes: number;
}
export type QuotaResult = { ok: true } | { ok: false; reason: 'files' | 'storage'; message: string };

const mb = (n: number) => `${(n / 1024 ** 2).toFixed(1)} MB`;

/** Cabe no limite do espaço? Regra pura (limite nulo = sem limite). */
export function evaluateQuota(usage: Usage, limits: Limits, add: { files: number; bytes: number }): QuotaResult {
  if (limits.maxFiles !== null && usage.files + add.files > limits.maxFiles) {
    return { ok: false, reason: 'files', message: `Limite de ${limits.maxFiles} arquivo(s) do espaço atingido` };
  }
  if (limits.maxStorageBytes !== null && usage.bytes + add.bytes > limits.maxStorageBytes) {
    return {
      ok: false,
      reason: 'storage',
      message: `Limite de armazenamento do espaço atingido (${mb(usage.bytes)} de ${mb(limits.maxStorageBytes)} usados)`,
    };
  }
  return { ok: true };
}

export async function getWorkspaceState(workspaceId: string): Promise<{ limits: Limits; usage: Usage } | null> {
  const ws = await prisma.workspace.findUnique({ where: { id: workspaceId } });
  if (!ws) return null;
  const agg = await prisma.mediaFile.aggregate({ where: { workspaceId }, _count: true, _sum: { sizeBytes: true } });
  return {
    limits: { maxFiles: ws.maxFiles, maxStorageBytes: ws.maxStorageBytes === null ? null : Number(ws.maxStorageBytes) },
    usage: { files: agg._count, bytes: Number(agg._sum.sizeBytes ?? 0) },
  };
}

/** Confere a cota do espaço da requisição atual (sem contexto, como no worker, não há limite). */
export async function checkQuota(workspaceId: string | null, add: { files: number; bytes: number }): Promise<QuotaResult> {
  if (!workspaceId) return { ok: true };
  const state = await getWorkspaceState(workspaceId);
  if (!state) return { ok: true };
  return evaluateQuota(state.usage, state.limits, add);
}
