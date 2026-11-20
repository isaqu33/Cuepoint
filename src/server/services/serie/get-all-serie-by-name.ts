import { prisma } from '../../utils/db';
export async function getSerieByName(nameSerie: string, page: number) {
  const offset = page * 5;

  const info = await prisma.subcollection.findMany({
    skip: offset,
    take: 5,
    where: {
      title: {
        contains: nameSerie,
      },
    },
    include: {
      lessons: true,
      series: true,
    },
  });

  const infoLenght = await prisma.subcollection.findMany({
    where: {
      title: {
        contains: nameSerie,
      },
    },
    include: {
      lessons: true,
      series: true,
    },
  });

  return { info, infoLenght };
}
