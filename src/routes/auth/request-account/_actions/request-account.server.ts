import { RequestEvent } from '@sveltejs/kit';
import { createAccountRequest } from '../../../../server/services/request-account/admin/create';
import { z } from 'zod';

export async function requestAccount(
  { request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const name = (await formData?.get('name')?.toString()) ?? '';
  const email = (await formData?.get('email')?.toString()) ?? '';
  const requestAccount = (await formData?.get('request')?.toString()) ?? '';

  const response = await createAccountRequest({
    name: name,
    email: email,
    request: requestAccount,
  });

  if (response !== null) {
    return {
      status: 200,
      response: response,
      responseText: '✅ Ação concluída com sucesso',
    };
  }

  return {
    error: '⛔ Não foi possível concluir a ação',
  };
}
