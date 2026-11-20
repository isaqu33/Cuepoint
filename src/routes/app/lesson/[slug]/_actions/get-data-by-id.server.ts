import { fail, redirect } from '@sveltejs/kit';
import { z } from 'zod';
import { getLessontoEdit } from '../../../../../server/services/lesson/get-leeson-to-edit';
import { RequestEvent } from '@sveltejs/kit';
import { prisma } from '../../../../../server/utils/db';

export async function getAllDataServer(
  { params, url, locals }: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z, fail, redirect },
): Promise<object> {
  const leson = await getLessontoEdit(params.slug as string);

  if (!leson) {
    throw deps.redirect(303, '/app');
  }

  // Sem parâmetros na URL (ex.: link da Biblioteca), deduz coleção/subcoleção pelas relações.
  const rel = await prisma.mediaFile.findUnique({
    where: { id: leson.id },
    select: {
      series: { select: { id: true, title: true }, take: 1 },
      courses: { select: { id: true, title: true }, take: 1 },
    },
  });

  return {
    data: leson,
    isAdmin: !!(locals.user?.isAdmin || locals.user?.isSystem),
    book: url.searchParams.get('book') ?? rel?.courses[0]?.title ?? '',
    idbook: url.searchParams.get('idbook') ?? rel?.courses[0]?.id ?? '',
    studies: url.searchParams.get('studies') ?? rel?.series[0]?.title ?? '',
    idstudies: url.searchParams.get('idstudies') ?? rel?.series[0]?.id ?? '',
  };
}
