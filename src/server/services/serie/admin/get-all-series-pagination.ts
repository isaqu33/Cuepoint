import { prisma } from '../../../utils/db';

export async function getAllSeriesPaginationAdmin(page: number) {
  const offset = page * 50;

  return await prisma.subcollection.findMany({
    skip: offset,
    take: 50,
    include: {
      lessons: true,
      series: true,
      courses: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
