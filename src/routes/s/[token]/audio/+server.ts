import { error } from '@sveltejs/kit';
import { resolveShare } from '../../../../server/share/resolve';
import { assertHttpUrl, toInternalStorageUrl } from '../../../../server/transcription/media';
import { prisma } from '../../../../server/utils/db';
import type { RequestHandler } from './$types';

/**
 * Áudio do link, servido por aqui (com suporte a Range para o player) e conferindo a validade do link A CADA
 * requisição: o endereço do storage nunca é entregue ao visitante, e revogar o link corta o acesso na hora.
 */
export const GET: RequestHandler = async ({ params, request }) => {
  const share = await resolveShare(params.token);
  if (!share.ok) throw error(share.status, share.message);
  const file = await prisma.mediaFile.findUnique({ where: { id: share.lessonId }, select: { audiofile: true } });
  if (!file?.audiofile) throw error(404, 'Este arquivo não tem áudio');

  const upstream = await fetch(assertHttpUrl(toInternalStorageUrl(file.audiofile)), {
    headers: request.headers.get('range') ? { Range: request.headers.get('range') as string } : {},
  });
  if (!upstream.ok && upstream.status !== 206) throw error(502, 'Não foi possível carregar o áudio');

  const headers = new Headers({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex', 'Accept-Ranges': 'bytes' });
  for (const h of ['content-type', 'content-length', 'content-range']) {
    const v = upstream.headers.get(h);
    if (v) headers.set(h, v);
  }
  return new Response(upstream.body, { status: upstream.status, headers });
};
