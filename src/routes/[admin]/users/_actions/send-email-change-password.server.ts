import { RequestEvent } from '@sveltejs/kit';
import { z } from 'zod';
import { sendEmailVerify } from '../../../../utils/emails/confirmation';
import { getById } from '../../../../server/services/user/get-by-id';
import jwt from 'jsonwebtoken';

export async function sendEmailUserChangePassword(
  { cookies, request }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<object> {
  const formData = await request.formData();

  const idUser = formData?.get('id')?.toString() ?? '';

  const getUserInfos = await getById({ id: idUser });

  const token = jwt.sign({ userId: getUserInfos?.id }, process.env.APP_JWT_SECRET_KEY as string);

  const sendedEmail = await sendEmailVerify(
    getUserInfos?.email as string,
    getUserInfos?.name as string,
    token,
    'changePasswordEmail',
  );

  if (sendedEmail !== null) {
    return {
      status: 200,
      statusText: '✅ Ação concluída com sucesso',
    };
  }

  return {
    status: 555,
    statusText: '⛔ Não foi possível concluir a ação',
  };
}
