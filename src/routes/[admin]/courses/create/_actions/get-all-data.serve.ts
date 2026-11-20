import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getAlllessons } from '../../../../../server/services/lesson/get-all-lessons';
import { getAllSeriesForm } from '../../../../../server/services/serie/admin/get-all-series-form';

export async function getAllDataCourseFormServer(
  { cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const allSeries = await getAllSeriesForm();

  if (getAlllessons !== null) {
    return {
      allSeries: allSeries,
      language: cookies.get('language'),
    };
  } else {
    return {
      error: "Chave não identificada",
    };
  }
}
