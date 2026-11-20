import { prisma } from '../../utils/db';

export async function getSerieByTitle(title: string) {
  return await prisma.subcollection.findFirst({
    where: {
      title,
    },
  });
}
