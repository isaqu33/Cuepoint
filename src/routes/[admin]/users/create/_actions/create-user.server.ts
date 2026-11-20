import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { createUser } from '../../../../../server/services/user/create-user';
import { getUsertoEdit } from '../../../../../server/services/user/get-user-to-edit';
import { registerNewPassword } from '$lib/server/password';
import { emit } from '../../../../../server/events/publish';

export async function createUserServer(
  { request, locals }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formDataRequest = await request.formData();

  const name = (await formDataRequest?.get('Name')?.toString()) ?? '';
  const email = (await formDataRequest?.get('email')?.toString()) ?? '';
  const password = (await formDataRequest?.get('password')?.toString()) ?? '';
  const selectedGroup = (await formDataRequest?.get('selectedGroup')?.toString()) ?? '';

  const existingEmailUser = await getUsertoEdit({ emailuser: email });

  if (existingEmailUser == null) {
    const user = await createUser({ name, email, isAdmin: JSON.parse(selectedGroup) });

    const userCreated = await registerNewPassword(user.id, password);

    if (userCreated !== null) {
      await emit('identity.member.invited', user.id, { memberId: user.id, invitedByUserId: locals.user?.id }).catch(() => undefined);
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

  return {
    status: 555,
    existingUserEmail:
      existingEmailUser !== null ? 'Já existe uma conta com esse e-mail' : null,
    statusText: '⛔ Não foi possível concluir a ação',
  };
}
