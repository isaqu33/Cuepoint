import argon2 from 'argon2';
import { createPassword } from '../../server/services/password/create';
import { findPassword } from '../../server/services/password/find';
import { findPasswordById } from '../../server/services/password/find-by-id';
import { updatePasswordDatabase } from '../../server/services/password/update';

async function hashedPassword(password: string) {
  return await argon2.hash(password, { type: argon2.argon2id });
}

export async function registerNewPassword(idUser: string, password: string) {
  const hashed = await hashedPassword(password);

  return createPassword({ idUser, password: String(hashed) });
}

export async function verifyPasswordByUserId(userId: string, password: string) {
  const user = await findPassword(userId);

  if (!user) return null;

  const isValid = await argon2.verify(user.password?.hashed_password as string, password);
  if (!isValid) return null;

  return user;
}

export async function updatePassword(lastPasswordId: string, newPassword: string) {
  const password = await findPasswordById(lastPasswordId);

  if (!password) return null;

  const hashed = await hashedPassword(newPassword);

  await updatePasswordDatabase(lastPasswordId, hashed);

  return password;
}
