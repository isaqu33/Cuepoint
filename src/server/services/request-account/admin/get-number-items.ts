import { prisma } from '../../../utils/db';
export async function getItensNumber() {
  const result = await prisma.accountRequest.count();

  return result;
}
