import { prisma } from '../../../utils/db';

export async function getAllACoursesToDeletAll() {
  return await prisma.collection.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}
