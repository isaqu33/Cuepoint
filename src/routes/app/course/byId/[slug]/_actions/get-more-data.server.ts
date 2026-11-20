import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import type { Course } from '../types';
import { getCourseByLimite } from '../../../../../../server/services/course/app/get-data-by-limit';

export async function getMoreDataFromCourseById(
  { request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const idCourse = (await formData?.get('id')?.toString()) ?? '';

  const coursesPagination = (await formData?.get('coursesPagination')?.toString()) ?? '';

  const course: Course = (await getCourseByLimite(
    idCourse,
    Number(coursesPagination),
  )) as unknown as Course;

  return {
    data: course,
  };
}
