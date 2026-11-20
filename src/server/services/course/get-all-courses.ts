import { prisma } from '../../utils/db';

export async function getAllCourses(numberTake?: number) {
  return await prisma.collection.findMany({
    take: numberTake ? numberTake : 100,
    where: {
      isPublished: true,
    },
    orderBy: {
      createdAt: 'asc',
    },
    select: {
      id: true,
      photoLeson: true,
      title: true,
      about: true,
    },
  });
}
