import { prisma } from '../../../utils/db';

export async function getAllCoursesPaginationAdmin(page: number) {
  const offset = page * 50;

  return await prisma.collection.findMany({
    skip: offset,
    take: 50,

    orderBy: {
      createdAt: 'desc',
    },
  });
}
