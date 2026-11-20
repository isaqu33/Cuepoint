import { prisma } from '../../utils/db';
export async function getLessonByNameAll(nameLesson: string) {
  const result = await prisma.mediaFile.findMany({
    where: {
      title: {
        contains: nameLesson,
      },
    },
    select: {
      id: true,
      photoLeson: true,
      title: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return result;
}
