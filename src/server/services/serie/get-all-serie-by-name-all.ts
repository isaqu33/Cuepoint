import { prisma } from '../../utils/db';
export async function getSerieByNameAll(nameSerie: string) {
  const result = await prisma.subcollection.findMany({
    where: {
      title: {
        contains: nameSerie,
      },
    },
    select: {
      id: true,
      photoLeson: true,
      title: true,
    },
  });

  return result;
}
