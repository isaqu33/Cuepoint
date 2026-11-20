import { prisma } from '../../../server/utils/db';
import type { PageServerLoad } from './$types';

/** Espaços de trabalho com uso x limites. Só o operador de plataforma (hooks). */
export const load: PageServerLoad = async () => {
  const [spaces, usage, members] = await Promise.all([
    prisma.workspace.findMany({ orderBy: { createdAt: 'asc' } }),
    prisma.mediaFile.groupBy({ by: ['workspaceId'], _count: true, _sum: { sizeBytes: true } }),
    prisma.user.groupBy({ by: ['workspaceId'], _count: true }),
  ]);
  const u = new Map(usage.map((x) => [x.workspaceId, x]));
  const m = new Map(members.map((x) => [x.workspaceId, x._count]));
  return {
    workspaces: spaces.map((w) => ({
      id: w.id,
      name: w.name,
      slug: w.slug,
      maxFiles: w.maxFiles,
      maxStorageBytes: w.maxStorageBytes === null ? null : Number(w.maxStorageBytes),
      files: u.get(w.id)?._count ?? 0,
      storageBytes: Number(u.get(w.id)?._sum.sizeBytes ?? 0),
      members: m.get(w.id) ?? 0,
    })),
  };
};
