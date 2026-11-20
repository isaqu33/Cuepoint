import { json } from '@sveltejs/kit';
import { hashRequest, isValidKey, lookup, store } from '../../../../../server/idempotency';
import { getJobView } from '../../../../../server/transcription/job-view';
import { requestTranscription } from '../../../../../server/transcription/request';
import type { RequestHandler } from './$types';

/**
 * Pede a transcrição de um arquivo. Responde `202 Accepted` com `Location` do estado do job
 * (não espera o processamento). `Idempotency-Key` opcional: repetir a chamada devolve a mesma resposta.
 * Autorização de administrador feita em hooks (src/server/security/access.ts).
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
  const userId = locals.user?.id;
  if (!userId) return json({ error: 'Não autenticado' }, { status: 401 });

  const location = `/api/jobs/${params.id}`;
  const key = request.headers.get('Idempotency-Key');
  const scope = `transcribe:${userId}`;
  const reqHash = hashRequest({ lessonId: params.id });

  if (key !== null) {
    if (!isValidKey(key)) {
      return json({ error: 'Idempotency-Key inválida (8 a 128 caracteres: letras, números, _ - : .)' }, { status: 400 });
    }
    const prior = await lookup(scope, key, reqHash);
    if (prior.kind === 'conflict') {
      return json({ error: 'Esta Idempotency-Key já foi usada em outro pedido' }, { status: 422 });
    }
    if (prior.kind === 'replay') {
      return json(prior.response.body, {
        status: prior.response.status,
        headers: { Location: location, 'Idempotent-Replayed': 'true' },
      });
    }
  }

  const result = await requestTranscription(params.id, userId);
  if (!result.ok) return json({ error: result.message }, { status: result.status });

  const body = {
    message: result.enqueued ? 'Transcrição enfileirada' : 'Já existe uma transcrição em andamento para este arquivo',
    enqueued: result.enqueued,
    job: await getJobView(params.id),
  };
  if (key !== null) await store(scope, key, reqHash, { status: 202, body });
  return json(body, { status: 202, headers: { Location: location } });
};
