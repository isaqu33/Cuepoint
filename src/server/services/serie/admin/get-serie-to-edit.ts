import { prisma } from '../../../utils/db';
export async function getSerietoEditAdmin(idLesson: string) {
  const infoSerie = await prisma.subcollection.findFirst({
    where: {
      id: idLesson,
    },
    include: {
      lessons: true,
      series: true,
      tags: true,
      grouptag: true,
      files: true,
      attachments: {
        include: {
          files: true,
        },
      },
    },
  });

  return infoSerie;
}
