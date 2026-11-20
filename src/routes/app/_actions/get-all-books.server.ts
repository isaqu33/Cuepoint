import type { RequestEvent } from '@sveltejs/kit';
import { getAllCourses } from '../../../server/services/course/get-all-courses';
import { prisma } from '../../../server/utils/db';

/** Dados da Biblioteca: coleções, números gerais e arquivos recentes. */
export async function getAllBooks({ cookies }: RequestEvent): Promise<object> {
  const visible = { isPublished: { not: false } } as const;

  const [books, total, ready, inProgress, failed, recent] = await Promise.all([
    getAllCourses(),
    prisma.mediaFile.count({ where: visible }),
    prisma.mediaFile.count({ where: { ...visible, transcriptionStatus: 'READY' } }),
    prisma.mediaFile.count({
      where: { ...visible, transcriptionStatus: { in: ['QUEUED', 'PROCESSING'] } },
    }),
    prisma.mediaFile.count({ where: { ...visible, transcriptionStatus: 'FAILED' } }),
    prisma.mediaFile.findMany({
      where: visible,
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        title: true,
        photoLeson: true,
        transcriptionStatus: true,
        series: { select: { id: true, title: true }, take: 1 },
        courses: { select: { id: true, title: true }, take: 1 },
      },
    }),
  ]);

  return {
    books,
    stats: { total, ready, inProgress, failed },
    recent,
    language: cookies.get('language'),
  };
}
