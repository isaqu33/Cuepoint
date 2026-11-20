import { prisma } from '../../../utils/db';
export async function getcoursetoEditAdmin(idLesson: string) {
  const infocourse = await prisma.collection.findFirst({
    where: {
      id: idLesson,
    },
    include: {
      courses: true,
      lessons: true,
      series: true,
      tags: true,
      groupTags: true,
      files: true,
      attachments: {
        include: {
          files: true,
        },
      },
    },
  });

  return infocourse;
}
