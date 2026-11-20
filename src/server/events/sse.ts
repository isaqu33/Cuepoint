import type { DomainEvent } from './contracts';

/** Quadro SSE (text/event-stream). Quebras de linha no dado viram várias linhas `data:`. */
export function sseFrame(name: string, data: unknown, id?: string): string {
  const lines = JSON.stringify(data).split('\n').map((l) => `data: ${l}`);
  return `${id ? `id: ${id}\n` : ''}event: ${name}\n${lines.join('\n')}\n\n`;
}

/** Comentário SSE: mantém a conexão viva atrás de proxies sem disparar evento no cliente. */
export const SSE_HEARTBEAT = ': keep-alive\n\n';

export type JobFrame = { name: 'progress' | 'status' | 'cue'; data: Record<string, unknown>; terminal: boolean };

/** Traduz um evento de domínio para o que o navegador precisa (sem expor o envelope interno). */
export function jobFrameFor(event: DomainEvent): JobFrame | null {
  switch (event.type) {
    case 'media.transcription.queued':
      return { name: 'status', data: { status: 'QUEUED', progress: 0 }, terminal: false };
    case 'media.transcription.started':
      return { name: 'status', data: { status: 'PROCESSING', attempt: event.data.attempt }, terminal: false };
    case 'media.transcription.progress':
      return { name: 'progress', data: { status: 'PROCESSING', progress: event.data.percent }, terminal: false };
    case 'media.transcription.cue':
      return {
        name: 'cue',
        data: { index: event.data.index, startMs: event.data.startMs, endMs: event.data.endMs, text: event.data.text },
        terminal: false,
      };
    case 'media.transcription.completed':
      return { name: 'status', data: { status: 'READY', progress: 100 }, terminal: true };
    case 'media.transcription.failed':
      // Falha com nova tentativa pendente não encerra o acompanhamento.
      return {
        name: 'status',
        data: { status: event.data.final ? 'FAILED' : 'QUEUED', error: event.data.error, attempt: event.data.attempt },
        terminal: event.data.final,
      };
    default:
      return null;
  }
}
