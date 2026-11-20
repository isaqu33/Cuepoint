import { json } from '@sveltejs/kit';
import { EXPORT_FORMATS, parseVttToCues, safeFilename, type ExportFormat } from '../../../../../server/transcription/subtitles';
import { prisma } from '../../../../../server/utils/db';
import type { RequestHandler } from './$types';

/**
 * Exporta a transcrição em TXT, SRT ou VTT (`?format=`). Qualquer membro logado; arquivo não publicado só para
 * administradores. O nome do download vem do título, sem acentos nem símbolos.
 */
export const GET: RequestHandler = async ({ params, url, locals }) => {
  const format = (url.searchParams.get('format') ?? 'txt').toLowerCase();
  if (!(format in EXPORT_FORMATS)) return json({ error: 'Formato inválido (use txt, srt ou vtt)' }, { status: 400 });

  const lesson = await prisma.mediaFile.findUnique({
    where: { id: params.id },
    select: { title: true, isPublished: true, transcript: { select: { vtt: true, transcription: true } } },
  });
  const isAdmin = !!(locals.user?.isAdmin || locals.user?.isSystem);
  if (!lesson || (lesson.isPublished === false && !isAdmin)) return json({ error: 'Arquivo não encontrado' }, { status: 404 });
  if (!lesson.transcript?.vtt) return json({ error: 'Este arquivo ainda não tem transcrição' }, { status: 404 });

  const cues = parseVttToCues(lesson.transcript.vtt);
  const body = EXPORT_FORMATS[format as ExportFormat].render(cues);
  return new Response(body, {
    headers: {
      'Content-Type': EXPORT_FORMATS[format as ExportFormat].mime,
      'Content-Disposition': `attachment; filename="${safeFilename(lesson.title, format)}"`,
      'Cache-Control': 'private, no-store',
    },
  });
};
