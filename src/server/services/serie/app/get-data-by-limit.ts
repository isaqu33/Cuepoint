import { prisma } from '../../../utils/db';

export async function getSerieByLimite(idCourse: string, numberTake?: number) {
  const result = await prisma.subcollection.findFirst({
    where: {
      id: idCourse,
    },
    include: {
      files: true,
      lessons: {
        where: {
          isPublished: true,
        },
        take: numberTake ? numberTake : 100,
      },
    },
  });

  return result;
}
