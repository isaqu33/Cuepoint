import { prisma } from '../../utils/db';
export async function getSerieByNameandId(nameSerie: string, id: string) {
  const infoSerie = await prisma.subcollection.findFirst({
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
    },
  });

  return infoSerie;
}
