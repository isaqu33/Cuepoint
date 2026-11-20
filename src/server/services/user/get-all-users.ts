import { prisma } from '../../utils/db';

export async function getAllUsers() {
  return await prisma.user.findMany({
    include: {
      emailservice: true,
      groupActions: {
        include: {
          roles: true,
        },
      },
    },
  });
}
