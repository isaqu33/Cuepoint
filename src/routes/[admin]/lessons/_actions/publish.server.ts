import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { getLessontoEdit } from '../../../../server/services/lesson/get-leeson-to-edit';
import type { lessonType } from '../types';
import { publishLesson } from '../../../../server/services/lesson/publish';

export async function publishAction(
  { request, cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const id = formData?.get('id')?.toString() ?? '';

  const leson: lessonType = (await getLessontoEdit(id)) as unknown as lessonType;

  if (leson.isPublished == true) {
    return {
      status: 400,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  const isDone = await publishLesson(id);

  if (isDone !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  return {
    status: 400,
    statusText: '⛔ Não foi possível concluir a ação',
  };
}
