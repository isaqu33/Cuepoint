import { prisma } from '../../../utils/db';
export async function getItensNumber() {
  const result = await prisma.collection.count();

  return result;
}
