import { prisma } from '../../utils/db';
export async function getUserByName(nameTag: string, page: number) {
  const offset = page * 5;

  const info = await prisma.user.findMany({
    skip: offset,
    take: 5,

    where: {
      name: {
        contains: nameTag,
      },
    },
    include: {
      emailservice: true,
      groupActions: {
        include: {
          roles: true,
        },
      },
    },
  });

  const infoLenght = await prisma.user.findMany({
    where: {
      name: {
        contains: nameTag,
      },
    },
  });

  return { info, infoLenght };
}
