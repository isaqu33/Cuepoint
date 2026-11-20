import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { updatePassword } from '$lib/server/password';
import { getUsertoEdit } from '../../../../../server/services/user/get-user-to-edit';

export async function resetPassword(
  { request, cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const id = formData?.get('id')?.toString() ?? '';
  const confirmedPassword = formData?.get('confirmPassword')?.toString() ?? '';

  const usertoedid = await getUsertoEdit({ idUser: id });

  const changedPassword = await updatePassword(
    usertoedid?.password?.id as string,
    confirmedPassword,
  );

  if (changedPassword) {
    return {
      status: 200,
      statusText: 'Senha alterada com sucesso',
      statusForTest: 'sendedEmail',
    };
  }

  return {
    status: 555,
    statusText: 'Não foi possível alterar a senha.',
  };
}
