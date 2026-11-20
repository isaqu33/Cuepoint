import { prisma } from '../../../utils/db';

export async function getLessonByName(lessonTitle: string) {
  const infoLesson = await prisma.mediaFile.findFirst({
    where: {
      title: lessonTitle,
    },
  });

  return infoLesson;
}
