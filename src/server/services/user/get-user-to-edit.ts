import { prisma } from '../../utils/db';
interface getUsertoEditProp {
  idUser?: string;
  emailuser?: string;
}
export async function getUsertoEdit({ idUser, emailuser }: getUsertoEditProp) {
  if (idUser !== undefined) {
    const infoUser = await prisma.user.findFirst({
      where: {
        id: idUser,
      },
      include: {
        password: true,

        emailservice: true,
      },
    });
    return infoUser;
  } else {
    const infoUser = await prisma.user.findFirst({
      where: {
        email: emailuser,
      },
      include: {
        password: true,

        emailservice: true,
      },
    });

    return infoUser;
  }
}
