import { prisma } from '../../utils/db';

export async function unPublishLesson(id: string) {
  return await prisma.mediaFile.update({
    where: { id },
    data: {
      isPublished: false,
    },
  });
}
