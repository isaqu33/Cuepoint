import { json } from '@sveltejs/kit';
import { getJobView } from '../../../../server/transcription/job-view';
import type { RequestHandler } from './$types';

/** Estado persistido do job de transcrição (o id do job é o id do arquivo). Só administradores (hooks). */
export const GET: RequestHandler = async ({ params }) => {
  const job = await getJobView(params.id);
  if (!job) return json({ error: 'Trabalho não encontrado' }, { status: 404 });
  return json(job, { headers: { 'Cache-Control': 'no-store' } });
};
