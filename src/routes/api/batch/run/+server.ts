import { json } from '@sveltejs/kit';
import { runBatchJob, type BatchJobName } from '../../../../server/batch/jobs';
import type { RequestHandler } from './$types';

/** Dispara manualmente um job em lote (mesmo código do agendamento). Só administradores (hooks). */
export const POST: RequestHandler = async ({ url }) => {
  const job = url.searchParams.get('job');
  if (job !== 'reconcile' && job !== 'nightly' && job !== 'relay') {
    return json({ error: 'Informe ?job=reconcile, ?job=relay ou ?job=nightly' }, { status: 400 });
  }
  return json(await runBatchJob(job as BatchJobName, 'manual'), { status: 200 });
};
