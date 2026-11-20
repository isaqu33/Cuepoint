import { prisma } from '../../utils/db';

export async function unPublishSerie(id: string) {
  return await prisma.subcollection.update({
    where: { id },
    data: {
      isPublished: false,
    },
  });
}
