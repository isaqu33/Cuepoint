import { json } from '@sveltejs/kit';
import { prisma } from '../../../../server/utils/db';
import type { RequestHandler } from './$types';

/** Revoga um link na hora (o endereço deixa de funcionar). Só administradores (hooks). */
export const DELETE: RequestHandler = async ({ params }) => {
  const link = await prisma.shareLink.findUnique({ where: { id: params.id } });
  // O arquivo do link precisa estar no espaço do administrador (consulta escopada).
  const file = link ? await prisma.mediaFile.findUnique({ where: { id: link.mediaFileId }, select: { id: true } }) : null;
  if (!link || !file) return json({ error: 'Link não encontrado' }, { status: 404 });
  if (!link.revokedAt) await prisma.shareLink.update({ where: { id: link.id }, data: { revokedAt: new Date() } });
  return json({ ok: true });
};
