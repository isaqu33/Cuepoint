import { prisma } from '../../utils/db';

interface updateUserInOurBase {
  idUser: string;
  isAdmin: boolean;
  newname: string;
  newemail: string;
}

export async function updateUserInOurBase({
  idUser,
  isAdmin,
  newname,
  newemail,
}: updateUserInOurBase) {
  return await prisma.user.update({
    where: {
      id: idUser,
    },
    data: {
      email: newemail,
      name: newname,
      username: newname,
      isAdmin: isAdmin,
    },
  });
}
