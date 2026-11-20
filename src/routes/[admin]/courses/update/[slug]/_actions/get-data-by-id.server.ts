import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getAllSeriesForm } from '../../../../../../server/services/serie/admin/get-all-series-form';
import { getcoursetoEditAdmin } from '../../../../../../server/services/course/admin/get-course-to-edit';

export async function getAllInfosByIdServer(
  { cookies, params }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const course = await getcoursetoEditAdmin(params.slug as string);

  const allSeries = await getAllSeriesForm();

  return {
    data: course,
    userid: params.slug,
    allSeries: allSeries,
    language: cookies.get('language'),
  };
}
