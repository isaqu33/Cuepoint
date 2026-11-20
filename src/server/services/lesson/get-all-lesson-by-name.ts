import { prisma } from '../../utils/db';
export async function getLessonByName(nameLesson: string, page: number) {
  const offset = page * 5;
  const info = await prisma.mediaFile.findMany({
    skip: offset,
    take: 5,

    where: {
      title: {
        contains: nameLesson,
      },
    },
    include: {
      tags: true,
      attachments: {
        include: {
          files: true,
        },
      },
      transcript: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  const infoLenght = await prisma.mediaFile.findMany({
    where: {
      title: {
        contains: nameLesson,
      },
    },
  });

  return { info, infoLenght };
}
