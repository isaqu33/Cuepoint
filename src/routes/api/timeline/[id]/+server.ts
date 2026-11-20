import { json } from '@sveltejs/kit';
import { prisma } from '../../../../server/utils/db';
import type { RequestHandler } from './$types';

/**
 * Linha do tempo de uma entidade (arquivo): os fatos duráveis do `EventLog`, do mais antigo ao mais novo.
 * É o assinante de auditoria — consulta por entidade. Só administradores (hooks).
 */
export const GET: RequestHandler = async ({ params, url }) => {
  const limit = Math.min(200, Math.max(1, Number(url.searchParams.get('limit') ?? 100)));
  const rows = await prisma.eventLog.findMany({
    where: { aggregateId: params.id },
    orderBy: { occurredAt: 'asc' },
    take: limit,
    select: { eventId: true, type: true, occurredAt: true, data: true },
  });
  const userIds = [...new Set(rows.map((r) => (r.data as { userId?: string }).userId).filter((v): v is string => !!v))];
  const users = userIds.length
    ? await prisma.user.findMany({ where: { id: { in: userIds } }, select: { id: true, name: true, email: true } })
    : [];
  const who = new Map(users.map((u) => [u.id, u.name || u.email]));
  return json({
    events: rows.map((r) => ({
      id: r.eventId,
      type: r.type,
      occurredAt: r.occurredAt.toISOString(),
      actor: who.get((r.data as { userId?: string }).userId ?? '') ?? null,
      data: r.data,
    })),
  });
};
