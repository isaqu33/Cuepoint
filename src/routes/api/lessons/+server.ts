import { json } from '@sveltejs/kit';
import { z } from 'zod';
import { createLessonFromUploads } from '../../../server/lesson/create-from-uploads';
import type { RequestHandler } from './$types';

const bodySchema = z.object({
  title: z.string().trim().min(1).max(200),
  description: z.string().trim().min(1).max(2000),
  imageKey: z.string(),
  audioKey: z.string(),
  imageName: z.string().max(200).optional(),
  audioName: z.string().max(200).optional(),
});

/** Cria um arquivo a partir de objetos já enviados ao storage (usado pelo envio em lote). Só administradores (hooks). */
export const POST: RequestHandler = async ({ request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Não autenticado' }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return json({ error: 'Dados inválidos' }, { status: 400 });

  const result = await createLessonFromUploads({ userId, ...parsed.data });
  if (!result.ok) return json({ error: result.message }, { status: result.status });
  return json({ id: result.id, links: { job: `/api/jobs/${result.id}` } }, { status: 201, headers: { Location: `/api/jobs/${result.id}` } });
};
