import { z } from 'zod';

/** Nome da fila e evento de progresso: contrato compartilhado entre web e worker. */
export const TRANSCRIPTION_QUEUE = 'transcriptionQueue';
export const PROGRESS_EVENT = 'progresso';

export const transcriptionJobSchema = z.object({
  lessonId: z.string().min(1),
  userId: z.string().min(1),
  /** Correlação com o pedido HTTP que originou o job (logs do worker). */
  requestId: z.string().max(64).optional(),
  traceparent: z.string().max(80).optional(),
});
export type TranscriptionJob = z.infer<typeof transcriptionJobSchema>;

export const progressEventSchema = z.object({
  lessonId: z.string(),
  porcentagem: z.number().min(0).max(100),
});
export type ProgressEvent = z.infer<typeof progressEventSchema>;

/** Chave de idempotência: no máximo um job ativo por aula. */
export const jobIdFor = (lessonId: string) => `transcribe-${lessonId}`;
