import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { getUsertoEdit } from '../../../server/services/user/get-user-to-edit';
import { updatePassword } from '$lib/server/password';

export async function POST(
  event: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<Response> {
  const body = await event.request.json();
  const { confirmPassword, idUser } = body.inputsInfos;

  // TODO: COLOCAR VERIFICADOR DE DE TOKEN(cooKIES )

  const usertoedid = await getUsertoEdit({ idUser: idUser });

  const changedPassword = await updatePassword(usertoedid?.password?.id as string, confirmPassword);

  if (changedPassword) {
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
