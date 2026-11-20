import { prisma } from '../../../utils/db';
export async function getItensNumber() {
  const result = await prisma.user.count();

  return result;
}
