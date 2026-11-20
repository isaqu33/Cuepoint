import { prisma } from '../../utils/db';

export async function getSomeLessons(numberTake?: number) {
  const someLessons = await prisma.mediaFile.findMany({
    take: numberTake ? numberTake : 10,
    orderBy: {
      description: 'desc',
    },
    select: {
      id: true,
      title: true,
      photoLeson: true,
      description: true,
    },
  });

  return someLessons;
}
