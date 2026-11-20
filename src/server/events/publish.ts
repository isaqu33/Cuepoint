import type { Prisma } from '@prisma/client';
import { transcriptionConfig } from '../transcription/config';
import { prisma } from '../utils/db';
import { currentWorkspaceId } from '../workspace/context';
import { createBus, createRedisTransport, type EventBus } from './bus';
import { DURABLE, buildEvent, type DomainEvent, type EventData, type EventType } from './contracts';

let bus: EventBus | undefined;
export const getBus = (): EventBus => (bus ??= createBus(createRedisTransport(transcriptionConfig().redis)));

/** Dados para gravar o evento no log (use dentro de uma transação junto com a mudança de estado). */
export const eventLogData = (event: DomainEvent, workspaceId?: string | null): Prisma.EventLogUncheckedCreateInput => ({
  workspaceId: workspaceId ?? null,
  eventId: event.id,
  type: event.type,
  aggregateId: event.aggregateId,
  version: event.version,
  data: event.data as Prisma.InputJsonValue,
  occurredAt: new Date(event.occurredAt),
});

/**
 * Publica no tópico. Falha de publicação não derruba a operação de negócio:
 * eventos duráveis continuam no log sem `publishedAt` e são reenviados pelo relay (`relay.ts`).
 */
export async function publishEvent(event: DomainEvent): Promise<boolean> {
  try {
    await getBus().publish(event);
  } catch (err) {
    console.warn(`[events] não foi possível publicar ${event.type}: ${(err as Error).message}`);
    return false;
  }
  // Outbox: marca o evento durável como entregue ao tópico; o que ficar sem marca é republicado pelo relay.
  if (DURABLE[event.type]) {
    await prisma.eventLog
      .updateMany({ where: { eventId: event.id, publishedAt: null }, data: { publishedAt: new Date() } })
      .catch(() => undefined);
  }
  return true;
}

/**
 * Espaço de trabalho do evento: o da requisição em andamento; no worker/lotes (sem requisição), o do arquivo
 * ou membro a que o evento se refere. Quem já sabe (ex.: arquivo prestes a ser excluído) pode informar.
 */
export async function workspaceForAggregate(aggregateId: string): Promise<string | null> {
  const fromRequest = currentWorkspaceId();
  if (fromRequest) return fromRequest;
  const file = await prisma.mediaFile.findUnique({ where: { id: aggregateId }, select: { workspaceId: true } });
  if (file) return file.workspaceId;
  const user = await prisma.user.findUnique({ where: { id: aggregateId }, select: { workspaceId: true } });
  return user?.workspaceId ?? null;
}

/** Atalho: constrói, grava no log (se durável) e publica. */
export async function emit<T extends EventType>(
  type: T,
  aggregateId: string,
  data: EventData<T>,
  opts: { workspaceId?: string | null } = {},
): Promise<DomainEvent> {
  const event = buildEvent(type, aggregateId, data);
  if (DURABLE[type]) {
    const workspaceId = opts.workspaceId ?? (await workspaceForAggregate(aggregateId));
    await prisma.eventLog.create({ data: eventLogData(event, workspaceId) });
  }
  await publishEvent(event);
  return event;
}
