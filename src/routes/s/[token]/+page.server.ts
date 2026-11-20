import { error } from '@sveltejs/kit';
import { resolveShare } from '../../../server/share/resolve';
import { parseVttToCues } from '../../../server/transcription/subtitles';
import { isVideoMedia } from '../../../lib/utils/media';
import { prisma } from '../../../server/utils/db';
import type { PageServerLoad } from './$types';

/** Página pública de um link temporário: leitura do arquivo e da transcrição, sem login. */
export const load: PageServerLoad = async ({ params, setHeaders }) => {
  const share = await resolveShare(params.token);
  if (!share.ok) throw error(share.status, share.message);

  const file = await prisma.mediaFile.findUnique({
    where: { id: share.lessonId },
    select: { title: true, description: true, photoLeson: true, audiofile: true, files: { orderBy: { createdAt: 'asc' }, select: { type: true } }, transcript: { select: { vtt: true } } },
  });
  if (!file) throw error(404, 'Link não encontrado');

  // Contagem de visualizações: melhor esforço, nunca derruba a página.
  await prisma.shareLink.update({ where: { id: share.linkId }, data: { views: { increment: 1 }, lastViewedAt: new Date() } }).catch(() => undefined);

  // O conteúdo é privado: nada de cache compartilhado nem indexação, e o endereço não vaza por Referer.
  setHeaders({ 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex, nofollow', 'Referrer-Policy': 'no-referrer' });

  return {
    token: params.token,
    title: file.title,
    description: file.description ?? '',
    photo: file.photoLeson ?? '',
    hasAudio: !!file.audiofile,
    isVideo: isVideoMedia(file.audiofile, file.files[1]?.type),
    expiresAt: share.expiresAt.toISOString(),
    cues: file.transcript?.vtt ? parseVttToCues(file.transcript.vtt) : [],
  };
};
