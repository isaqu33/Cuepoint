import { prisma } from '../../utils/db';

export async function deletUserInOurBase(id: string) {
  const result = await prisma.user.delete({
    where: {
      id: id,
    },
  });

  return result;
}
