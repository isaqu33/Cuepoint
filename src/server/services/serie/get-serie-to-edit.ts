import { prisma } from '../../utils/db';

export async function getSerietoEdit(idSerie: string) {
  const infoSerie = await prisma.subcollection.findFirst({
    where: {
      id: idSerie,
    },
    include: {
      lessons: {
        where: {
          isPublished: true,
        },
      },
      files: true,
      courses: true,
    },
  });

  return infoSerie;
}
