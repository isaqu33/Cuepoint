import { prisma } from '../../utils/db';
export async function getCourseByName(nameSerie: string, page: number) {
  const offset = page * 5;
  const info = await prisma.collection.findMany({
    skip: offset,
    take: 5,

    where: {
      title: {
        contains: nameSerie,
      },
    },
    include: {
      lessons: true,
      series: {
        include: {
          lessons: true,
        },
      },
      courses: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const infoLenght = await prisma.collection.findMany({
    where: {
      title: {
        contains: nameSerie,
      },
    },
  });

  return { info, infoLenght };
}
