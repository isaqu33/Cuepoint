import { prisma } from '../../utils/db';

export async function deletCourseInOurBase(courseId: string) {
  const course = await prisma.collection.findUnique({
    where: { id: courseId },
  });

  if (!course) return null;

  const result = await prisma.collection.delete({
    where: { id: courseId },
  });

  return result;
}
