import { prisma } from '../../utils/db';

export async function verifySerieTitle(title: string) {
  const existingTitle = await prisma.subcollection.findFirst({
    where: {
      title: title,
    },
  });
  return existingTitle;
}
