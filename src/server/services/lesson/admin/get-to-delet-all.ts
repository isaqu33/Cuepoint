import { prisma } from '../../../utils/db';

export async function getAllALessonsToDeletAll() {
  return await prisma.mediaFile.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}
