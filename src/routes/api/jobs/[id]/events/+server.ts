import { json } from '@sveltejs/kit';
import { listenAggregate } from '../../../../../server/events/hub';
import { SSE_HEARTBEAT, jobFrameFor, sseFrame } from '../../../../../server/events/sse';
import { readCues } from '../../../../../server/transcription/cues';
import { getJobView } from '../../../../../server/transcription/job-view';
import type { RequestHandler } from './$types';

/**
 * Progresso do job por SSE (streaming unidirecional servidor → navegador). Só administradores (hooks).
 *
 * Retomada: ao conectar (ou reconectar, o EventSource faz sozinho) a primeira mensagem `snapshot` traz o estado
 * PERSISTIDO no PostgreSQL; depois chegam `progress`/`status` ao vivo. Assina o tópico ANTES de ler o estado,
 * então nenhum evento se perde entre os dois. Encerra sozinho quando o job chega a um estado final.
 */
export const GET: RequestHandler = async ({ params, request }) => {
  const initial = await getJobView(params.id);
  if (!initial) return json({ error: 'Trabalho não encontrado' }, { status: 404 });

  const encoder = new TextEncoder();
  let cleanup = () => {};

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let closed = false;
      const send = (chunk: string) => {
        if (!closed) controller.enqueue(encoder.encode(chunk));
      };
      const close = () => {
        if (closed) return;
        closed = true;
        cleanup();
        try {
          controller.close();
        } catch {
          /* já fechado */
        }
      };

      const stopListening = await listenAggregate(params.id, (event) => {
        const frame = jobFrameFor(event);
        if (!frame) return;
        send(sseFrame(frame.name, frame.data, event.id));
        if (frame.terminal) setTimeout(close, 50);
      });
      const heartbeat = setInterval(() => send(SSE_HEARTBEAT), 15_000);
      cleanup = () => {
        clearInterval(heartbeat);
        stopListening();
      };
      request.signal.addEventListener('abort', close);

      send('retry: 3000\n\n');
      const snapshot = (await getJobView(params.id)) ?? initial;
      // Trechos já prontos nesta execução: quem conecta no meio não perde o que já saiu.
      const cues = snapshot.terminal ? [] : await readCues(params.id).catch(() => []);
      send(sseFrame('snapshot', { ...snapshot, cues }));
      if (snapshot.terminal && snapshot.status !== 'IDLE') setTimeout(close, 50);
    },
    cancel() {
      cleanup();
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  });
};
