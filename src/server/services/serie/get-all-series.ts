import { prisma } from '../../utils/db';

export async function getAllSeries(numberTake?: number) {
  const series = await prisma.subcollection.findMany({
    take: numberTake ? numberTake : 10,
    orderBy: {
      createdAt: 'desc',
    },
    select: {
      id: true,
      photoLeson: true,
      title: true,
      about: true,
    },
  });

  return series;
}
