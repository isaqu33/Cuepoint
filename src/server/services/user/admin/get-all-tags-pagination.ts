import { prisma } from '../../../utils/db';

export async function getAllUsersPaginationAdmin(
  page: number,
  pageSize = 50,
  excludeUsers: { id?: string; email?: string }[] = [],
) {
  const excludeFilter = excludeUsers.map((user) => ({
    NOT: user,
  }));

  return await prisma.user.findMany({
    skip: page * pageSize,
    take: pageSize,
    where: {
      AND: excludeFilter,
    },
    include: {
      emailservice: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}
