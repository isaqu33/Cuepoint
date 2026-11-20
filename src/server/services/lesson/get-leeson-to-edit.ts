import { prisma } from '../../utils/db';
export async function getLessontoEdit(idLesson: string) {
  const infoLesson = await prisma.mediaFile.findFirst({
    where: {
      id: idLesson,
    },
    include: {
      contetText: true,
      transcript: true,
      files: true,
    },
  });

  return infoLesson;
}
