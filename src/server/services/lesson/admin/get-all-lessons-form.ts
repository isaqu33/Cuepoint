import { prisma } from '../../../utils/db';

export async function getAlllessonsForm() {
  return await prisma.mediaFile.findMany({
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
}
