import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { deletAccountRequestInOurBase } from '../../../../../server/services/request-account/admin/delete';

export async function deleteAccountRequest(
  { request, cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formDataRequest = await request.formData();

  const id = (await formDataRequest?.get('id')?.toString()) ?? '';

  const deletedRequest = await deletAccountRequestInOurBase(id);

  if (deletedRequest !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
    };
  } else {
    return {
      status: 555,
      statusText: '⛔ Não foi possível concluir a ação',
    };
  }
}
