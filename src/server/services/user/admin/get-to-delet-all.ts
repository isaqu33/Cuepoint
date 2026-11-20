import { prisma } from '../../../utils/db';

export async function getAllAUserToDeletAll() {
  return await prisma.user.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}
