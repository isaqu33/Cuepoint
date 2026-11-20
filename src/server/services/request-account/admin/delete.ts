import { prisma } from '../../../utils/db';

export async function deletAccountRequestInOurBase(id: string) {
  await prisma.accountRequest.delete({
    where: {
      id: id,
    },
  });
}
