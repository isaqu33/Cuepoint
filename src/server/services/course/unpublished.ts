import { prisma } from '../../utils/db';

export async function unPublishCourse(id: string) {
  return await prisma.collection.update({
    where: { id },
    data: {
      isPublished: false,
    },
  });
}
