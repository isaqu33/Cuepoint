import { prisma } from '../../utils/db';

export async function updateUserveriry(iduser: string) {
  const result = await prisma.user.update({
    where: {
      id: iduser,
    },
    data: {
      emailservice: {
        create: {
          isVerified: true,
          verifiedAt: new Date(),
        },
      },
    },
  });

  return result;
}
