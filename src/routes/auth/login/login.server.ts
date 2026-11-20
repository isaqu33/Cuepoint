import { fail } from '@sveltejs/kit';
import { z } from 'zod';
import { getUsertoEdit } from '../../../server/services/user/get-user-to-edit';
import { RequestEvent } from '@sveltejs/kit';
import { verifyPasswordByUserId } from '$lib/server/password';
import { generateSessionToken, createSession, setSessionTokenCookie } from '$lib/server/auth';

export async function login(event: RequestEvent, deps = { z, fail }): Promise<object> {
  const schema = deps.z.object({
    email: deps.z.string().trim().min(1, { message: 'O e-mail é obrigatório' }),
    password: deps.z.string().trim().min(1, { message: 'A senha é obrigatória' }),
  });

  const formData = await event.request.formData();
  const email = formData.get('email')?.toString();
  const password = formData.get('password')?.toString();

  const validator = schema.safeParse({ email, password });

  if (!validator.success) {
    return {
      status: 402,
      statusText: 'Erro de validação: ' + validator.error.errors[0].message,
    };
  }

  const VerifyUser = await getUsertoEdit({ emailuser: email });

  if (!VerifyUser) {
    return {
      status: 400,
      statusText: '⛔ Este e-mail não foi encontrado.',
    };
  }

  if (VerifyUser?.isBlocked && !VerifyUser?.isSystem) {
    return {
      status: 401,
      statusText: '⛔ Não foi possível concluir a ação',
    };
  }

  const verifyPassword = await verifyPasswordByUserId(VerifyUser.id, password as string);

  if (verifyPassword == null) {
    return {
      status: 500,
      statusText: '⛔ Senha incorreta',
    };
  }

  const token = generateSessionToken();

  const result = await createSession(token, VerifyUser.id);

  if (result) {
    await setSessionTokenCookie(event, token, result.expiresAt);
    return {
      status: 200,
      text: '✅ Ação concluída com sucesso',
    };
  } else {
    return {
      status: 401,
      statusText: '⛔ Não foi possível concluir a ação',
    };
  }
}
