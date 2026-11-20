import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { getUsertoEdit } from '../../server/services/user/get-user-to-edit';
import { RequestEvent } from '@sveltejs/kit';
import { deleteSessionTokenCookie } from '$lib/server/auth';
import { toPublicUser } from '../../server/security/public-user';

export async function getAllDataServer(
  event: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z, fail, redirect },
): Promise<object> {
  const infoUserLogged = await event.locals.user;

  const userInfo = await getUsertoEdit({ idUser: infoUserLogged?.id });

  if (userInfo?.isBlocked) {
    await deleteSessionTokenCookie(event);
  }

  if (!userInfo?.isAdmin && !userInfo?.isSystem) {
    throw deps.redirect(303, '/app');
  }

  if (userInfo !== null) {
    return {
      data: toPublicUser(userInfo),
    };
  }
  return {
    error: "key didn't identify!",
  };
}
