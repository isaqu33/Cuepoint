import { prisma } from '../utils/db';
import { evaluateLink, hashToken, isTokenShape } from './token';

export type ResolvedShare =
  | { ok: true; linkId: string; expiresAt: Date; lessonId: string }
  | { ok: false; status: 404 | 410; message: string };

/** Token → link válido. Sempre confere formato, existência, revogação e validade no servidor. */
export async function resolveShare(token: string, now = new Date()): Promise<ResolvedShare> {
  if (!isTokenShape(token)) return { ok: false, status: 404, message: 'Link não encontrado' };
  const link = await prisma.shareLink.findUnique({ where: { tokenHash: hashToken(token) } });
  if (!link) return { ok: false, status: 404, message: 'Link não encontrado' };
  const state = evaluateLink(link, now);
  if (!state.valid) {
    return { ok: false, status: 410, message: state.reason === 'revogado' ? 'Este link foi desativado' : 'Este link expirou' };
  }
  return { ok: true, linkId: link.id, expiresAt: link.expiresAt, lessonId: link.mediaFileId };
}
