import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { getAll } from '../../../../../server/services/request-account/admin/get-all-data';
import { getItensNumber } from '../../../../../server/services/request-account/admin/get-number-items';

export async function getAllDataServer(
  { cookies, url }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const page = url.searchParams.get('page');
  const pageSize = 50;

  const response = await getAll(Number(page), pageSize);
  const totalNumbersPagination = await getItensNumber();

  if (response !== null) {
    return {
      data: response,
      page,
      totalNumbersPagination,
      language: cookies.get('language'),
      userSystem: process.env.APP_SYSTEM_USER_EMAIL,
    };
  }

  return {
    error: 'Algo deu errado',
  };
}
