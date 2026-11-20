import type { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { prisma } from '../../../../server/utils/db';
import { requestTranscription } from '../../../../server/transcription/request';

const inputSchema = z.object({ LessonSelected: z.string().min(1) });

/**
 * Solicita a transcrição de uma aula. O web só valida, registra o estado e enfileira
 * (ver `requestTranscription`); o processamento pesado acontece no worker.
 */
export async function trascriptFile(args: RequestEvent): Promise<{ status: number; statusText: string }> {
  const user = args.locals.user;
  if (!user?.id) return { status: 401, statusText: '⛔ Não autenticado' };
  const actor = await prisma.user.findUnique({ where: { id: user.id }, select: { isAdmin: true } });
  if (!actor?.isAdmin) return { status: 403, statusText: '⛔ Apenas administradores' };

  const formData = await args.request.formData();
  const parsed = inputSchema.safeParse({ LessonSelected: formData.get('LessonSelected') ?? formData.get('id') });
  if (!parsed.success) return { status: 400, statusText: '⛔ Arquivo inválido' };

  const result = await requestTranscription(parsed.data.LessonSelected, user.id);
  if (!result.ok) return { status: result.status, statusText: `⛔ ${result.message}` };
  return {
    status: 200,
    statusText: result.enqueued
      ? '✅ Transcrição enfileirada'
      : 'ℹ️ Já existe uma transcrição em andamento para este arquivo',
  };
}
