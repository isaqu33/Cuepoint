import { prisma } from '../../utils/db';
export async function getCourseByNameandId(nameSerie: string, id: string) {
  const infoSerie = await prisma.collection.findFirst({
    where: {
      id: id,
    },
    include: {
      lessons: {
        where: {
          title: {
            contains: nameSerie,
          },
        },
      },
      series: {
        where: {
          title: {
            contains: nameSerie,
          },
        },
      },
      courses: {
        where: {
          title: {
            contains: nameSerie,
          },
        },
      },
    },
  });

  return infoSerie;
}
