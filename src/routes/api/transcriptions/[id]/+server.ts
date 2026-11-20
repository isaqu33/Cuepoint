import { json } from '@sveltejs/kit';
import { emit } from '../../../../server/events/publish';
import { renderTranscription, validateCues } from '../../../../server/transcription/subtitles';
import { lessonVisible } from '../../../../server/workspace/guard';
import { prisma } from '../../../../server/utils/db';
import type { RequestHandler } from './$types';

/**
 * Revisão: grava a transcrição editada com tempos. Só administradores (hooks, método PUT).
 * O servidor revalida tudo (ordem, limites, texto) e regrava VTT e HTML a partir dos trechos; publica
 * `media.transcription.edited` (aparece na linha do tempo do arquivo).
 */
export const PUT: RequestHandler = async ({ params, request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Não autenticado' }, { status: 401 });

  const body = await request.json().catch(() => null);
  const valid = validateCues((body as { cues?: unknown } | null)?.cues);
  if (!valid.ok) return json({ error: valid.message }, { status: 400 });

  if (!(await lessonVisible(params.id))) return json({ error: 'Arquivo não encontrado' }, { status: 404 });
  const existing = await prisma.transcription.findUnique({ where: { lessonId: params.id }, select: { id: true } });
  if (!existing) return json({ error: 'Este arquivo ainda não tem transcrição' }, { status: 404 });

  const { vtt, html } = renderTranscription(valid.cues);
  await prisma.transcription.update({
    where: { id: existing.id },
    data: { vtt, transcription: html, updatedByUserId: userId },
  });
  await emit('media.transcription.edited', params.id, { lessonId: params.id, userId, cues: valid.cues.length }).catch(() => undefined);
  return json({ ok: true, cues: valid.cues.length });
};
