import { prisma } from '../../../utils/db';
export async function getItensNumber() {
  const result = await prisma.mediaFile.count();

  return result;
}
