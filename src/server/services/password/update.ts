import { prisma } from '../../utils/db';

export async function updatePasswordDatabase(passwordId: string, newPassword: string) {
  return await prisma.password.update({
    where: {
      id: passwordId,
    },
    data: {
      hashed_password: newPassword,
    },
  });
}
