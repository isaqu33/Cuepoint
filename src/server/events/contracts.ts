import { randomUUID } from 'node:crypto';
import { z } from 'zod';

/** Tópico único de eventos de domínio (Redis Pub/Sub). */
export const EVENTS_CHANNEL = 'cuepoint:events';

const envelope = {
  /** Identifica o evento; assinantes usam para ser idempotentes. */
  id: z.string().uuid(),
  version: z.literal(1),
  occurredAt: z.string().datetime(),
  /** Entidade a que o evento se refere (aqui, o id do arquivo). */
  aggregateId: z.string().min(1),
};

const ids = { lessonId: z.string().min(1), userId: z.string().min(1) };

/**
 * Eventos são FATOS no passado ("foi concluída"), não comandos.
 * Mudança incompatível = nova `version`.
 */
export const eventSchema = z.discriminatedUnion('type', [
  z.object({ ...envelope, type: z.literal('media.transcription.queued'), data: z.object({ ...ids }) }),
  z.object({
    ...envelope,
    type: z.literal('media.transcription.started'),
    data: z.object({ ...ids, attempt: z.number().int().min(1) }),
  }),
  z.object({
    ...envelope,
    type: z.literal('media.transcription.progress'),
    data: z.object({ lessonId: ids.lessonId, percent: z.number().min(0).max(100) }),
  }),
  z.object({
    ...envelope,
    type: z.literal('media.transcription.cue'),
    data: z.object({
      lessonId: ids.lessonId,
      index: z.number().int().min(0),
      startMs: z.number().int().min(0),
      endMs: z.number().int().min(0),
      text: z.string(),
    }),
  }),
  z.object({
    ...envelope,
    type: z.literal('media.transcription.completed'),
    data: z.object({ ...ids, durationMs: z.number().int().min(0), language: z.string() }),
  }),
  z.object({
    ...envelope,
    type: z.literal('media.transcription.failed'),
    data: z.object({ ...ids, error: z.string(), attempt: z.number().int().min(1), final: z.boolean() }),
  }),
  z.object({
    ...envelope,
    type: z.literal('media.transcription.edited'),
    data: z.object({ ...ids, cues: z.number().int().min(0) }),
  }),
  // Outros domínios (mídia e identidade): mesmos envelope e regras dos eventos de transcrição.
  z.object({
    ...envelope,
    type: z.literal('media.file.uploaded'),
    data: z.object({ ...ids, audioBytes: z.number().int().min(0) }),
  }),
  z.object({
    ...envelope,
    type: z.literal('media.file.shared'),
    data: z.object({ ...ids, expiresAt: z.string().datetime() }),
  }),
  z.object({
    ...envelope,
    type: z.literal('media.file.deleted'),
    data: z.object({
      lessonId: ids.lessonId,
      reason: z.enum(['manual', 'retention']),
      userId: z.string().min(1).optional(),
    }),
  }),
  z.object({
    ...envelope,
    type: z.literal('identity.member.invited'),
    data: z.object({ memberId: z.string().min(1), invitedByUserId: z.string().min(1).optional() }),
  }),
]);

export type DomainEvent = z.infer<typeof eventSchema>;
export type EventType = DomainEvent['type'];
export type EventData<T extends EventType> = Extract<DomainEvent, { type: T }>['data'];

/**
 * Durável: gravado no log do banco junto com a mudança de estado (não se perde).
 * Efêmero: só trafega no tópico (ex.: progresso, que muda várias vezes por segundo).
 */
export const DURABLE: Record<EventType, boolean> = {
  'media.transcription.queued': true,
  'media.transcription.started': true,
  'media.transcription.progress': false,
  'media.transcription.cue': false,
  'media.transcription.completed': true,
  'media.transcription.failed': true,
  'media.transcription.edited': true,
  'media.file.uploaded': true,
  'media.file.shared': true,
  'media.file.deleted': true,
  'identity.member.invited': true,
};

export function buildEvent<T extends EventType>(type: T, aggregateId: string, data: EventData<T>): DomainEvent {
  return eventSchema.parse({
    id: randomUUID(),
    version: 1,
    occurredAt: new Date().toISOString(),
    aggregateId,
    type,
    data,
  });
}
