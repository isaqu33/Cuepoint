import { prisma } from '../../utils/db';

export async function getAlllessons(numberTake?: number) {
  return await prisma.mediaFile.findMany({
    take: numberTake ? numberTake : 10,

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
