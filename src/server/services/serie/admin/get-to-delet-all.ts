import { prisma } from '../../../utils/db';

export async function getAllAseriesToDeletAll() {
  return await prisma.subcollection.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}
