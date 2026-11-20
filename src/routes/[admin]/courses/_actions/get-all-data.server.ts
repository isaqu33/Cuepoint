import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';

import { getAllCoursesPaginationAdmin } from '../../../../server/services/course/admin/get-all-course-pagination';
import { getItensNumber } from '../../../../server/services/course/admin/get-number-items';

export async function getAllDataServer(
  { cookies, url }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const page = url.searchParams.get('page');

  const result = await getAllCoursesPaginationAdmin(Number(page));
  const totalNumbersItensCourse = await getItensNumber();

  if (result !== null) {
    return {
      data: result,
      page,
      totalNumbersPagination: totalNumbersItensCourse,
      language: cookies.get('language'),
    };
  } else {
    return {
      error: "Chave não identificada",
    };
  }
}
