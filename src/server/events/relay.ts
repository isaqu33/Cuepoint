import { eventSchema, type DomainEvent } from './contracts';
import { publishEvent } from './publish';
import { prisma } from '../utils/db';

export type UnpublishedRow = {
  eventId: string;
  type: string;
  aggregateId: string;
  version: number;
  data: unknown;
  occurredAt: Date;
};

export interface RelayDeps {
  /** Eventos duráveis sem `publishedAt`, criados antes de `olderThan`, do mais antigo ao mais novo. */
  listUnpublished(olderThan: Date, limit: number): Promise<UnpublishedRow[]>;
  publish(event: DomainEvent): Promise<boolean>;
}

export const prismaRelayDeps: RelayDeps = {
  listUnpublished: (olderThan, limit) =>
    prisma.eventLog.findMany({
      where: { publishedAt: null, createdAt: { lt: olderThan } },
      orderBy: { createdAt: 'asc' },
      take: limit,
    }),
  publish: publishEvent,
};

/** Reconstrói o envelope a partir da linha do log (valida contra o contrato; linha inválida é ignorada). */
export function rowToEvent(row: UnpublishedRow): DomainEvent | null {
  const parsed = eventSchema.safeParse({
    id: row.eventId,
    version: row.version,
    occurredAt: row.occurredAt.toISOString(),
    aggregateId: row.aggregateId,
    type: row.type,
    data: row.data,
  });
  return parsed.success ? parsed.data : null;
}

/**
 * Relay do outbox: republica os eventos duráveis que não chegaram ao tópico (Redis fora do ar, falha entre
 * gravar e publicar). Entrega "pelo menos uma vez": o mesmo `id` volta a circular e os assinantes já são
 * idempotentes (e-mail por `SET NX`, log por `eventId` único). A tolerância evita disputar com quem acabou de publicar.
 */
export async function relayUnpublished(
  deps: RelayDeps = prismaRelayDeps,
  opts: { now?: Date; graceMs?: number; limit?: number } = {},
) {
  const now = opts.now ?? new Date();
  const rows = await deps.listUnpublished(new Date(now.getTime() - (opts.graceMs ?? 30_000)), opts.limit ?? 100);
  let republished = 0;
  let failed = 0;
  let invalid = 0;
  for (const row of rows) {
    const event = rowToEvent(row);
    if (!event) {
      invalid++;
      continue;
    }
    if (await deps.publish(event)) republished++;
    else failed++;
  }
  return { found: rows.length, republished, failed, invalid };
}
