import { prisma } from '../../../utils/db';

export async function getCourseByName(title: string) {
  const infoCourse = await prisma.collection.findFirst({
    where: {
      title: title,
    },
  });

  return infoCourse;
}
