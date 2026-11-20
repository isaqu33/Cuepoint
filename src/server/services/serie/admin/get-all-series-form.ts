import { prisma } from '../../../utils/db';

export async function getAllSeriesForm() {
  return await prisma.subcollection.findMany({
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
