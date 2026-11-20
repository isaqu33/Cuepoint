import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';

import { getAlllessons } from '../../../server/services/lesson/get-all-lessons';

export async function getMoreLessonsPagination(
  { request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const paginationLesson = (await formData?.get('paginationLesson')?.toString()) ?? '';

  const lessons = await getAlllessons(Number(paginationLesson));

  return {
    targetEntity: 'lessons',
    lessons: lessons,
  };
}
