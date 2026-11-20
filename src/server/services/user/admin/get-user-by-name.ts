import { prisma } from '../../../utils/db';
export async function getUserByNameAdmin(username: string) {
  const infoSerie = await prisma.user.findFirst({
    where: {
      name: username,
    },
  });

  return infoSerie;
}
