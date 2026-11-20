import { prisma } from '../../../utils/db';
export async function lockUnlockServer(isUser: string) {
  const infouser = await prisma.user.findFirst({
    where: {
      id: isUser,
    },
  });

  const userUpdated = await prisma.user.update({
    where: { id: isUser },
    data: {
      isBlocked: !infouser?.isBlocked,
    },
  });

  return userUpdated;
}
