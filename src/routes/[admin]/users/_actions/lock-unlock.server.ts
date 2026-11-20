import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { lockUnlockServer } from '../../../../server/services/user/admin/lock-unlock';

export async function lockUnlockUserAction(
  { cookies, request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const idUser = formData?.get('id')?.toString() ?? '';

  const response = await lockUnlockServer(idUser);

  if (response !== null) {
    return {
      status: 200,
      response: response,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  return {
    error: 'Algo deu errado',
  };
}
