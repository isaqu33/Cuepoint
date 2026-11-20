import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { DEFAULT_WORKSPACE_ID } from '../../../../server/workspace/context';
import { prisma } from '../../../../server/utils/db';
import type { RequestHandler } from './$types';

const patchSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  /** `null` remove o limite. */
  maxFiles: z.number().int().min(1).nullable().optional(),
  maxStorageMB: z.number().int().min(1).nullable().optional(),
});

/** Ajusta nome e limites de um espaço. Só o operador de plataforma (hooks). */
export const PATCH: RequestHandler = async ({ params, request }) => {
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Dados inválidos' }, { status: 400 });
  const { name, maxFiles, maxStorageMB } = parsed.data;
  const exists = await prisma.workspace.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!exists) return json({ error: 'Espaço não encontrado' }, { status: 404 });
  await prisma.workspace.update({
    where: { id: params.id },
    data: {
      ...(name !== undefined ? { name } : {}),
      ...(maxFiles !== undefined ? { maxFiles } : {}),
      ...(maxStorageMB !== undefined ? { maxStorageBytes: maxStorageMB === null ? null : BigInt(maxStorageMB) * BigInt(1024 ** 2) } : {}),
    },
  });
  return json({ ok: true });
};

/**
 * Exclui um espaço de trabalho VAZIO (sem arquivos, coleções nem subcoleções) e os membros dele.
 * Nunca o espaço padrão. Só o operador de plataforma (hooks).
 */
export const DELETE: RequestHandler = async ({ params }) => {
  if (params.id === DEFAULT_WORKSPACE_ID) return json({ error: 'O espaço padrão não pode ser excluído' }, { status: 400 });
  const ws = await prisma.workspace.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!ws) return json({ error: 'Espaço não encontrado' }, { status: 404 });
  const [files, collections, subcollections] = await Promise.all([
    prisma.mediaFile.count({ where: { workspaceId: ws.id } }),
    prisma.collection.count({ where: { workspaceId: ws.id } }),
    prisma.subcollection.count({ where: { workspaceId: ws.id } }),
  ]);
  if (files + collections + subcollections > 0) {
    return json({ error: 'O espaço ainda tem conteúdo. Exclua os arquivos e coleções antes.' }, { status: 409 });
  }
  await prisma.$transaction([
    prisma.eventLog.deleteMany({ where: { workspaceId: ws.id } }),
    prisma.user.deleteMany({ where: { workspaceId: ws.id } }),
    prisma.workspace.delete({ where: { id: ws.id } }),
  ]);
  return json({ ok: true });
};
