import { enqueueTranscription } from './queue';
import { state } from './state';
import { emit } from '../events/publish';
import { prisma } from '../utils/db';
import { currentContext } from '../workspace/context';

export type RequestResult =
  | { ok: true; enqueued: boolean; lessonId: string }
  | { ok: false; status: 404 | 422 | 500; message: string };

/**
 * Pedido de transcrição (request-response que delega à fila): valida, registra o estado,
 * enfileira e devolve na hora. Compartilhado pela action do painel e pela API `/api/lessons/:id/transcription`.
 * O endereço do áudio vem do banco, nunca do cliente.
 */
export async function requestTranscription(lessonId: string, userId: string): Promise<RequestResult> {
  const lesson = await prisma.mediaFile.findUnique({ where: { id: lessonId }, select: { audiofile: true } });
  if (!lesson) return { ok: false, status: 404, message: 'Arquivo não encontrado' };
  if (!lesson.audiofile) return { ok: false, status: 422, message: 'Este arquivo não tem áudio' };

  try {
    const { enqueued } = await enqueueTranscription({ lessonId, userId, requestId: currentContext().requestId, traceparent: currentContext().traceparent });
    if (enqueued) {
      await state.queued(lessonId);
      await emit('media.transcription.queued', lessonId, { lessonId, userId });
    }
    return { ok: true, enqueued, lessonId };
  } catch (error) {
    console.error('Failed to enqueue transcription:', error);
    await state.failed(lessonId, 'Não foi possível enfileirar a transcrição.').catch(() => undefined);
    return { ok: false, status: 500, message: 'Não foi possível enfileirar a transcrição' };
  }
}
