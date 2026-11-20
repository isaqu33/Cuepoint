import { prisma } from '../../utils/db';

export async function findPassword(userId: string) {
  return await prisma.user.findUnique({
    where: {
      id: userId,
    },
    select: {
      password: true,
    },
  });
}
