import { prisma } from '../../utils/db';

export async function updateUserBoarding(iduser: string, typeUpdate?: string) {
  const userInfo = await await prisma.user.findUnique({
    where: {
      id: iduser,
    },
    include: {
      boardinguser: true,
    },
  });

  if (userInfo?.boardinguser) {
    const result = await prisma.user.update({
      where: {
        id: iduser,
      },
      data: {
        boardinguser: {
          update: {
            isforgetPasswordEmailSent: true,
            forgetPasswordEmailSentAt: new Date(),
          },
        },
      },
    });

    return result;
  }

  const result = await prisma.user.update({
    where: {
      id: iduser,
    },
    data: {
      boardinguser: {
        create: {
          isVerificationEmailSent: true,
          verificationEmailSentAt: new Date(),
        },
      },
    },
  });

  return result;
}
