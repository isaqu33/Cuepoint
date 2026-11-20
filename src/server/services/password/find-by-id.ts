import { prisma } from '../../utils/db';

export async function findPasswordById(passwordId: string) {
  return await prisma.password.findUnique({
    where: {
      id: passwordId,
    },
  });
}
