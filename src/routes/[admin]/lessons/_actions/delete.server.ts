import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { deleteLessonCompletely } from '../../../../server/services/lesson/delete-complete';

export async function deleteAction({ request, locals }: RequestEvent, deps = { z }): Promise<object> {
  const formData = await request.formData();
  const id = formData?.get('id')?.toString() ?? '';

  const deleted = id ? await deleteLessonCompletely(id, { reason: 'manual', userId: locals.user?.id }) : false;
  if (deleted) return { status: 200, text: '✅ Ação concluída com sucesso' };
  return { status: 500, text: '⛔ Não foi possível concluir a ação' };
}
