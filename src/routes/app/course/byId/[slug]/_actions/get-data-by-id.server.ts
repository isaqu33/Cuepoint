import { RequestEvent } from '@sveltejs/kit';
import { redirect } from '@sveltejs/kit';
import type { Course } from '../types';
import { getCourseByLimite } from '../../../../../../server/services/course/app/get-data-by-limit';

export async function getAllDataServer(
  { params, cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { redirect },
): Promise<object> {
  const course: Course = (await getCourseByLimite(params.slug as string)) as unknown as Course;

  if (!course) {
    throw deps.redirect(303, '/app');
  }

  return {
    data: course,
    language: cookies.get('language'),
  };
}
