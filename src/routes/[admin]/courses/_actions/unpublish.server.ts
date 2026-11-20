import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import type { CourseType } from '../types';
import { getCourseEdit } from '../../../../server/services/course/get-course-to-edit';
import { unPublishCourse } from '../../../../server/services/course/unpublished';

export async function unPublishAction(
  { request, cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const id = formData?.get('id')?.toString() ?? '';

  const course: CourseType = (await getCourseEdit(id)) as unknown as CourseType;

  if (course.isPublished == false) {
    return {
      status: 400,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  const isDone = await unPublishCourse(id);

  if (isDone !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  return {
    status: 400,
    statusText: '⛔ Senha incorreta',
  };
}
