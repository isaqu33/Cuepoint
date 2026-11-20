import { json } from '@sveltejs/kit';
import Redis from 'ioredis';
import { readMetrics } from '../../../server/events/subscribers/metrics';
import { transcriptionConfig } from '../../../server/transcription/config';
import { queueStats } from '../../../server/transcription/queue-stats';
import { prisma } from '../../../server/utils/db';
import type { RequestHandler } from './$types';

let redis: Redis | undefined;

/** Contadores dos eventos de transcrição (alimentados pelo assinante de métricas). Só administradores. */
export const GET: RequestHandler = async ({ locals }) => {
  if (!locals.user?.id) return json({ error: 'Não autenticado' }, { status: 401 });
  const actor = await prisma.user.findUnique({ where: { id: locals.user.id }, select: { isAdmin: true } });
  if (!actor?.isAdmin) return json({ error: 'Apenas administradores' }, { status: 403 });

  redis ??= new Redis(transcriptionConfig().redis);
  return json({ ...(await readMetrics(redis)), queueNow: await queueStats() });
};
