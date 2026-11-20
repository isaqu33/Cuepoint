import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getAllUsersPaginationAdmin } from '../../../../server/services/user/admin/get-all-tags-pagination';
import { getItensNumber } from '../../../../server/services/user/admin/get-number-items';
import { getUsertoEdit } from '../../../../server/services/user/get-user-to-edit';

export async function allUsers(
  { cookies, locals, url }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const page = url.searchParams.get('page');
  const pageSize = 50;

  const infoUserLogged = await locals.user;

  const isSystemUser = await getUsertoEdit({ idUser: infoUserLogged?.id });

  const excludeUsers = [{ id: infoUserLogged?.id }, { email: process.env.APP_SYSTEM_USER_EMAIL }];

  const response = await getAllUsersPaginationAdmin(Number(page), pageSize, excludeUsers);
  let totalNumbersPagination = await getItensNumber();

  if (isSystemUser?.email == process.env.APP_SYSTEM_USER_EMAIL) {
    totalNumbersPagination -= 1;
  } else {
    totalNumbersPagination -= 2;
  }

  if (response !== null) {
    return {
      data: response,
      page,
      totalNumbersPagination,
      language: cookies.get('language'),
      userLoged: infoUserLogged?.id,
      userSystem: process.env.APP_SYSTEM_USER_EMAIL,
    };
  }

  return {
    error: 'Algo deu errado',
  };
}
