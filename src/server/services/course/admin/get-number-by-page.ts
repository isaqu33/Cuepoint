import { prisma } from '../../../utils/db';
export async function getItensNumberByPages(page: number) {
  const offset = page * 5;

  const result = await prisma.collection.count({
    skip: offset,
    take: 5,
  });

  return result;
}
