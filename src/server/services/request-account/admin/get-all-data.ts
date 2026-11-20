import { prisma } from '../../../utils/db';

export async function getAll(page: number, pageSize = 50) {
  return await prisma.accountRequest.findMany({
    skip: page * pageSize,
    take: pageSize,
    orderBy: {
      id: 'desc',
    },
  });
}
