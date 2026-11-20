import { json } from '@sveltejs/kit';
import { retryFailedBatch } from '../../../../server/batch/jobs';
import type { RequestHandler } from './$types';

/** Reprocessa em lote os arquivos com falha (limite por execução). Só administradores (hooks). */
export const POST: RequestHandler = async ({ locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Não autenticado' }, { status: 401 });
  const result = await retryFailedBatch(userId);
  return json(result, { status: 202 });
};
