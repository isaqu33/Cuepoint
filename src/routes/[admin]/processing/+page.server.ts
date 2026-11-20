import type { PageServerLoad } from './$types';
import { prisma } from '../../../server/utils/db';

export const load: PageServerLoad = async () => {
  const jobs = await prisma.mediaFile.findMany({
    where: { transcriptionStatus: { not: 'IDLE' } },
    orderBy: { updatedAt: 'desc' },
    take: 100,
    select: {
      id: true,
      title: true,
      transcriptionStatus: true,
      transcriptionProgress: true,
      transcriptionError: true,
      updatedAt: true,
    },
  });
  const counts = {
    QUEUED: jobs.filter((j) => j.transcriptionStatus === 'QUEUED').length,
    PROCESSING: jobs.filter((j) => j.transcriptionStatus === 'PROCESSING').length,
    READY: jobs.filter((j) => j.transcriptionStatus === 'READY').length,
    FAILED: jobs.filter((j) => j.transcriptionStatus === 'FAILED').length,
  };
  // Feed de atividade: eventos duráveis, do mais novo para o mais antigo.
  // EventLog é escopado por espaço de trabalho (extensão do Prisma): só aparecem eventos do espaço atual.
  const events = await prisma.eventLog.findMany({ orderBy: { occurredAt: 'desc' }, take: 15 });
  const titles = new Map(
    (
      await prisma.mediaFile.findMany({
        where: { id: { in: [...new Set(events.map((e) => e.aggregateId))] } },
        select: { id: true, title: true },
      })
    ).map((l) => [l.id, l.title]),
  );
  const memberIds = events.filter((e) => e.type.startsWith('identity.')).map((e) => e.aggregateId);
  const members = memberIds.length
    ? new Map((await prisma.user.findMany({ where: { id: { in: memberIds } }, select: { id: true, name: true, email: true } })).map((u) => [u.id, u.name || u.email]))
    : new Map<string, string>();
  const activity = events.map((e) => ({
    id: e.eventId,
    type: e.type,
    lessonId: e.aggregateId,
    title: e.type.startsWith('identity.') ? (members.get(e.aggregateId) ?? 'Membro removido') : (titles.get(e.aggregateId) ?? 'Arquivo removido'),
    occurredAt: e.occurredAt.toISOString(),
    data: e.data as Record<string, unknown>,
  }));

  return { jobs, counts, activity, realtimeUrl: process.env.PUBLIC_REALTIME_URL ?? '' };
};
