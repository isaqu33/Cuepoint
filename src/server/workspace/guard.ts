import { prisma } from '../utils/db';

/**
 * Verificações de visibilidade para tabelas que NÃO têm `workspaceId` (EventLog, Transcription, ShareLink…):
 * o arquivo dono precisa estar visível no espaço da requisição. Como `mediaFile` é escopado, estas consultas
 * devolvem "não" para arquivos de outro espaço. Sem contexto (operador de plataforma, worker) tudo é visível.
 */
export async function lessonVisible(lessonId: string): Promise<boolean> {
  return (await prisma.mediaFile.count({ where: { id: lessonId } })) > 0;
}

export async function transcriptionVisible(transcriptionId: string): Promise<boolean> {
  const t = await prisma.transcription.findUnique({ where: { id: transcriptionId }, select: { lessonId: true } });
  return !!t?.lessonId && lessonVisible(t.lessonId);
}
