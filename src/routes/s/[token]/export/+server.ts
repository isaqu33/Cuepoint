import { error, json } from '@sveltejs/kit';
import { resolveShare } from '../../../../server/share/resolve';
import { EXPORT_FORMATS, parseVttToCues, safeFilename, type ExportFormat } from '../../../../server/transcription/subtitles';
import { prisma } from '../../../../server/utils/db';
import type { RequestHandler } from './$types';

/** Baixa a transcrição (TXT, SRT ou VTT) de um link temporário válido. */
export const GET: RequestHandler = async ({ params, url }) => {
  const share = await resolveShare(params.token);
  if (!share.ok) throw error(share.status, share.message);
  const format = (url.searchParams.get('format') ?? 'txt').toLowerCase();
  if (!(format in EXPORT_FORMATS)) return json({ error: 'Formato inválido (use txt, srt ou vtt)' }, { status: 400 });

  const file = await prisma.mediaFile.findUnique({ where: { id: share.lessonId }, select: { title: true, transcript: { select: { vtt: true } } } });
  if (!file?.transcript?.vtt) throw error(404, 'Este arquivo ainda não tem transcrição');
  const f = EXPORT_FORMATS[format as ExportFormat];
  return new Response(f.render(parseVttToCues(file.transcript.vtt)), {
    headers: {
      'Content-Type': f.mime,
      'Content-Disposition': `attachment; filename="${safeFilename(file.title, format)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
