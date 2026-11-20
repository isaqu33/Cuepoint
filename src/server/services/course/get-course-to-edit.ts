import { prisma } from '../../utils/db';

export async function getCourseEdit(idCourse: string) {
  const result = await prisma.collection.findFirst({
    where: {
      id: idCourse,
    },
    include: {
      files: true,
      series: true,
    },
  });

  return result;
}
