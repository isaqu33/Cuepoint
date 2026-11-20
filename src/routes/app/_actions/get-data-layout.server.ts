import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { getUsertoEdit } from '../../../server/services/user/get-user-to-edit';
import { deleteSessionTokenCookie } from '$lib/server/auth';
import { toPublicUser } from '../../../server/security/public-user';

export async function getAllDataToLayout(
  event: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const infoUserLogged = await event.locals.user;

  const userInfo = await getUsertoEdit({ idUser: infoUserLogged.id });

  if (userInfo?.isBlocked) {
    await deleteSessionTokenCookie(event);
  }

  if (userInfo !== null) {
    return {
      data: toPublicUser(userInfo),
    };
  }
  return {
    error: "Chave não identificada",
  };
}
