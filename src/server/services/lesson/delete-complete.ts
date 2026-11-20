import { prisma } from '../../utils/db';
import { emit } from '../../events/publish';
import { deleteFile } from '../file/delete-file';
import { deletLessonInOurBase } from './delete-lesson';
import { getLessontoEdit } from './get-leeson-to-edit';

/**
 * Exclui um arquivo da biblioteca por inteiro (registros de arquivo, objetos do storage, transcrição e o
 * próprio registro) e publica o fato `media.file.deleted`. Usado pela ação manual e pela retenção.
 */
export async function deleteLessonCompletely(
  lessonId: string,
  why: { reason: 'manual' | 'retention'; userId?: string },
): Promise<boolean> {
  const lesson = await getLessontoEdit(lessonId);
  if (!lesson) return false;
  for (const file of lesson.files ?? []) await deleteFile(file.id);
  const deleted = await deletLessonInOurBase(lessonId);
  if (deleted === null) return false;
  await emit('media.file.deleted', lessonId, { lessonId, ...why }, { workspaceId: lesson.workspaceId }).catch(() => undefined);
  return true;
}

export const lessonExists = (id: string) => prisma.mediaFile.count({ where: { id } }).then((n) => n > 0);
