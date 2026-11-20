import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getLessontoEdit } from '../../../../../../server/services/lesson/get-leeson-to-edit.js';

export async function getLessonByIdServer(
  { params, locals }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const leson = await getLessontoEdit(params.slug as string);

  return {
    data: leson,
    lessonId: params.slug,
  };
}
