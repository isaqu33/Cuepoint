import { prisma } from '../../utils/db';
export async function getSerietoEditByTitle(idLesson: string) {
  const infoLesson = await prisma.subcollection.findFirst({
    where: {
      title: idLesson,
    },
  });

  return infoLesson;
}
