import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { toPublicUser } from '../../../../../../server/security/public-user';
import { getUsertoEdit } from '../../../../../../server/services/user/get-user-to-edit';

export async function getByIdUser(
  { params }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const user = await getUsertoEdit({ idUser: params.slug });
  return {
    data: toPublicUser(user),
    userid: params.slug,
  };
}
