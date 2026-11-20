import { error } from '@sveltejs/kit';
import { prisma } from '../../../../../server/utils/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
  const w = await prisma.workspace.findUnique({ where: { id: params.slug } });
  if (!w) throw error(404, 'Espaço não encontrado');
  return { id: w.id, name: w.name, maxFiles: w.maxFiles, maxStorageMB: w.maxStorageBytes === null ? null : Math.round(Number(w.maxStorageBytes) / 1024 ** 2) };
};
