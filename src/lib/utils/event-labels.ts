/** Rótulos em português dos eventos de domínio (feed de atividade e linha do tempo). Função pura. */
export type EventTone = 'pill-queued' | 'pill-processing' | 'pill-ready' | 'pill-failed' | 'pill-idle';

export const EVENT_LABELS: Record<string, { text: string; tone: EventTone }> = {
  'media.transcription.queued': { text: 'entrou na fila', tone: 'pill-queued' },
  'media.transcription.started': { text: 'começou a transcrição', tone: 'pill-processing' },
  'media.transcription.completed': { text: 'transcrição concluída', tone: 'pill-ready' },
  'media.transcription.failed': { text: 'transcrição falhou', tone: 'pill-failed' },
  'media.transcription.edited': { text: 'transcrição editada', tone: 'pill-processing' },
  'media.file.uploaded': { text: 'arquivo enviado', tone: 'pill-ready' },
  'media.file.shared': { text: 'link de compartilhamento criado', tone: 'pill-queued' },
  'media.file.deleted': { text: 'arquivo excluído', tone: 'pill-failed' },
  'identity.member.invited': { text: 'membro convidado', tone: 'pill-queued' },
};

export const eventLabel = (type: string) => EVENT_LABELS[type] ?? { text: type, tone: 'pill-idle' as EventTone };

/** Detalhe curto de um evento (duração, tentativa, motivo…). */
export function eventDetail(type: string, data: Record<string, unknown>): string {
  switch (type) {
    case 'media.transcription.completed':
      return `${Math.max(1, Math.round(Number(data.durationMs) / 1000))} s`;
    case 'media.transcription.failed':
      return data.final ? 'sem novas tentativas' : `tentativa ${data.attempt}, será repetida`;
    case 'media.transcription.started':
      return `tentativa ${data.attempt}`;
    case 'media.transcription.edited':
      return `${data.cues} trecho(s)`;
    case 'media.file.uploaded':
      return `${(Number(data.audioBytes) / 1024 ** 2).toFixed(1)} MB`;
    case 'media.file.shared':
      return `válido até ${new Date(String(data.expiresAt)).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}`;
    case 'media.file.deleted':
      return data.reason === 'retention' ? 'pela política de retenção' : 'exclusão manual';
    default:
      return '';
  }
}
