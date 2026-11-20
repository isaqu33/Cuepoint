import { prisma } from '../../../utils/db';

interface getUsertoEditProp {
  name: string;
  idUser: string;
}
export async function updateUserName({ name, idUser }: getUsertoEditProp) {
  const user = await prisma.user.update({
    where: {
      id: idUser,
    },
    data: {
      name: name,
    },
  });

  return user;
}
