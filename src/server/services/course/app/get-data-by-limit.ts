import { prisma } from '../../../utils/db';

export async function getCourseByLimite(idCourse: string, numberTake?: number) {
  const result = await prisma.collection.findFirst({
    where: {
      id: idCourse,
    },
    include: {
      files: true,
      series: {
        where: {
          isPublished: true,
        },
        take: numberTake ? numberTake : 100,
      },
    },
  });

  return result;
}
