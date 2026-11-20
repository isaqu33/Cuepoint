import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { updateUserName } from '../../../server/services/user/admin/update-by-name';

export async function POST(
  event: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<Response> {
  const body = await event.request.json();
  const { name } = body.inputsInfos;

  const infoUserLogged = await event.locals.user;

  const result = await updateUserName({ name, idUser: infoUserLogged.id as string });

  if (result !== null) {
    return new Response('✅ Ação concluída com sucesso', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return new Response('⛔ Não foi possível concluir a ação', {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
