import { prisma } from '../../../utils/db';

export async function getAllCoursesForm() {
  return await prisma.collection.findMany({
    include: {
      tags: true,
      attachments: {
        include: {
          files: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
