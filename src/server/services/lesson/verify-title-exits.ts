import { prisma } from '../../utils/db';
export async function getLessontoEditByTitle(idLesson: string) {
  const infoLesson = await prisma.mediaFile.findFirst({
    where: {
      title: idLesson,
    },
  });

  return infoLesson;
}
