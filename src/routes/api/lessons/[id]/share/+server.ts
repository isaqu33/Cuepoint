import { json } from '@sveltejs/kit';
import { emit } from '../../../../../server/events/publish';
import { clampTtlHours, generateToken, hashToken } from '../../../../../server/share/token';
import { prisma } from '../../../../../server/utils/db';
import type { RequestHandler } from './$types';

/** Cria um link temporário de leitura. O token só aparece NESTA resposta (no banco fica o hash). Só administradores (hooks). */
export const POST: RequestHandler = async ({ params, request, locals, url }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Não autenticado' }, { status: 401 });
  // Consulta escopada ao espaço: arquivo de outro espaço devolve 404.
  const file = await prisma.mediaFile.findUnique({ where: { id: params.id }, select: { id: true, workspaceId: true, audiofile: true } });
  if (!file) return json({ error: 'Arquivo não encontrado' }, { status: 404 });

  const body = (await request.json().catch(() => ({}))) as { expiresInHours?: unknown };
  const hours = clampTtlHours(body.expiresInHours);
  const token = generateToken();
  const expiresAt = new Date(Date.now() + hours * 3_600_000);
  const link = await prisma.shareLink.create({
    data: { tokenHash: hashToken(token), mediaFileId: file.id, workspaceId: file.workspaceId, createdByUserId: userId, expiresAt },
  });
  await emit('media.file.shared', file.id, { lessonId: file.id, userId, expiresAt: expiresAt.toISOString() }).catch(() => undefined);
  return json({ id: link.id, url: `${url.origin}/s/${token}`, expiresAt: expiresAt.toISOString() }, { status: 201, headers: { 'Cache-Control': 'no-store' } });
};

/** Links do arquivo (sem o token, que não é recuperável). Só administradores (hooks). */
export const GET: RequestHandler = async ({ params }) => {
  const file = await prisma.mediaFile.findUnique({ where: { id: params.id }, select: { id: true } });
  if (!file) return json({ error: 'Arquivo não encontrado' }, { status: 404 });
  const links = await prisma.shareLink.findMany({ where: { mediaFileId: file.id }, orderBy: { createdAt: 'desc' }, take: 50 });
  const now = Date.now();
  return json({
    links: links.map((l) => ({
      id: l.id,
      createdAt: l.createdAt.toISOString(),
      expiresAt: l.expiresAt.toISOString(),
      revokedAt: l.revokedAt?.toISOString() ?? null,
      views: l.views,
      active: !l.revokedAt && l.expiresAt.getTime() > now,
    })),
  });
};
