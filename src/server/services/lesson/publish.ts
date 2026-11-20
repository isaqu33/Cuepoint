import { prisma } from '../../utils/db';

export async function publishLesson(id: string) {
  return await prisma.mediaFile.update({
    where: { id },
    data: {
      isPublished: true,
    },
  });
}
