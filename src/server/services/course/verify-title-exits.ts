import { prisma } from '../../utils/db';
export async function getCoursetoEditByTitle(idLesson: string) {
  const infoLesson = await prisma.collection.findFirst({
    where: {
      title: idLesson,
    },
  });

  return infoLesson;
}
