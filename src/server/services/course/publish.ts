import { prisma } from '../../utils/db';

export async function publishCourse(id: string) {
  return await prisma.collection.update({
    where: { id },
    data: {
      isPublished: true,
    },
  });
}
