import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';

import { getAllCourses } from '../../../server/services/course/get-all-courses';

export async function getMoreCoursesPagination(
  { request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const paginationCourse = (await formData?.get('paginationCourse')?.toString()) ?? '';

  const courses = await getAllCourses(Number(paginationCourse));

  return {
    targetEntity: 'courses',
    coursesLoaded: courses,
  };
}
