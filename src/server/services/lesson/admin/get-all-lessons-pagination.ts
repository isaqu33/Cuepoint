import { prisma } from '../../../utils/db';

export async function getAlllessonsPaginationAdmin(page: number) {
  const offset = page * 50;

  return await prisma.mediaFile.findMany({
    skip: offset,
    take: 50,
    include: {
      transcript: true,
      series: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
