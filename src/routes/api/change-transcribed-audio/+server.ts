import { z } from 'zod';
import { transcriptionVisible } from '../../../server/workspace/guard';
import { RequestEvent } from '@sveltejs/kit';
import { updateUserName } from '../../../server/services/user/admin/update-by-name';
import { updateTrnascribe } from '../../../server/services/transcribe/update';

export async function POST(
  event: RequestEvent,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deps = { z },
): Promise<Response> {
  const body = await event.request.json();

  const { html, idTranscribe } = body.formValues;

  // Transcription não tem espaço próprio: o arquivo dono precisa estar visível para quem pede.
  if (!(await transcriptionVisible(String(idTranscribe)))) {
    return new Response('⛔ Não foi possível concluir a ação', { status: 404, headers: { 'Content-Type': 'application/json' } });
  }

  const result = await updateTrnascribe({ id: idTranscribe, html: html });

  if (result !== null) {
    return new Response('✅ Ação concluída com sucesso', {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  return new Response('⛔ Não foi possível concluir a ação', {
    status: 400,
    headers: {
      'Content-Type': 'application/json',
    },
  });
}
