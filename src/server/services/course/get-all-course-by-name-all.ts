import { prisma } from '../../utils/db';
export async function getCourseByNameAll(nameSerie: string) {
  const result = await prisma.collection.findMany({
    where: {
      title: {
        contains: nameSerie,
      },
    },
    select: {
      id: true,
      photoLeson: true,
      title: true,
      about: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return result;
}
