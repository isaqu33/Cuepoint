import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getAlllessonsPaginationAdmin } from '../../../../server/services/lesson/admin/get-all-lessons-pagination';
import { getItensNumber } from '../../../../server/services/lesson/admin/get-number-items';

export async function getAllDatalessonServer(
  { cookies, url }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const page = url.searchParams.get('page');

  const result = await getAlllessonsPaginationAdmin(Number(page));
  const totalNumbersPagination = await getItensNumber();

  if (result !== null) {
    return {
      data: result,
      page,
      totalNumbersPagination: totalNumbersPagination,
      wsRouter: process.env.PUBLIC_REALTIME_URL ?? "",
    };
  } else {
    return {
      error: "Chave não identificada",
    };
  }
}
