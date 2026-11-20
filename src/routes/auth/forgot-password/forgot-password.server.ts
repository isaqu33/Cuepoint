import { fail, type Cookies } from '@sveltejs/kit';
import { z } from 'zod';
import { getUsertoEdit } from '../../../server/services/user/get-user-to-edit';
import { sendEmailVerify } from '../../../utils/emails/confirmation';
import { updateUserBoarding } from '../../../server/services/user/update-boarding';
import jwt from 'jsonwebtoken';
import { RequestEvent } from '@sveltejs/kit';

export async function forgotPassword(
  { request, cookies }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z, fail },
): Promise<object> {
  const formData = await request.formData();
  const email = (await formData?.get('email')?.toString()) ?? '';

  const userExites = await getUsertoEdit({ emailuser: email });

  if (userExites !== null) {
    const token = jwt.sign({ userId: userExites.id }, process.env.APP_JWT_SECRET_KEY as string);

    const sendedEmail = await sendEmailVerify(
      email,
      userExites.name as string,
      token,
      'forgotpassword',
    );

    if (sendedEmail !== null) {
      await updateUserBoarding(userExites.id);

      return {
        status: 200,
        statusText: '✅ Ação concluída com sucesso',
        statusForTest: 'sendedEmail',
      };
    }
  }

  return {
    status: 555,
    statusText: '⛔ Não foi possível concluir a ação',
  };
}
