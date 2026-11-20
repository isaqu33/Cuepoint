import { z } from 'zod';
import { RequestEvent } from '@sveltejs/kit';
import { updateUserInOurBase } from '../../../../../../server/services/user/update-user';
import { getUsertoEdit } from '../../../../../../server/services/user/get-user-to-edit';

export async function updateUserServer(
  { request, cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const name = formData?.get('name')?.toString() ?? '';
  const email = formData?.get('email')?.toString() ?? '';
  const iduser = formData?.get('id')?.toString() ?? '';
  const selectedGroupUser = (await formData?.get('selectedGroup')?.toString()) ?? '';

  const usertoedit = await getUsertoEdit({ idUser: iduser });

  const existingEmailInDataBase = await getUsertoEdit({ emailuser: email });

  const isNameUnchanged = name == usertoedit?.name;
  const isEmailUnchanged = email == usertoedit?.email;
  const isGroupUnchanged = JSON.parse(selectedGroupUser) == usertoedit?.isAdmin;

  if (isNameUnchanged && isEmailUnchanged && isGroupUnchanged) {
    return {
      status: 555,
      type: 'generalError',
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  if (existingEmailInDataBase && usertoedit?.email !== email) {
    return {
      status: 555,
      type: 'existingUserEmail',
      statusText: 'Já existe uma conta com esse e-mail',
    };
  }

  const updatedUser = await updateUserInOurBase({
    idUser: iduser,
    isAdmin: JSON.parse(selectedGroupUser),
    newname: name,
    newemail: email,
  });

  if (updatedUser !== null) {
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
