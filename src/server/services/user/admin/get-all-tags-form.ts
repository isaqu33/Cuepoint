import { prisma } from '../../../utils/db';

export async function getAllTagsForm() {
  return await prisma.tag.findMany({
    orderBy: {
      createdAt: 'desc',
    },
  });
}
