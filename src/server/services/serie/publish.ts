import { prisma } from '../../utils/db';

export async function publishSerie(id: string) {
  return await prisma.subcollection.update({
    where: { id },
    data: {
      isPublished: true,
    },
  });
}
